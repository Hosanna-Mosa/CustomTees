import crypto from 'crypto';
import Square from 'square';

const { SquareClient, SquareEnvironment } = Square || {};

const {
  SQUARE_ACCESS_TOKEN,
  SQUARE_LOCATION_ID,
  SQUARE_ENVIRONMENT = 'sandbox',
  SQUARE_CURRENCY = 'USD',
} = process.env;

let squareClient = null;

if (SQUARE_ACCESS_TOKEN && SQUARE_LOCATION_ID && SquareClient && SquareEnvironment) {
  squareClient = new SquareClient({
    token: SQUARE_ACCESS_TOKEN,
    environment: SQUARE_ENVIRONMENT.toLowerCase() === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
  });
}

export const isSquareConfigured = () => Boolean(squareClient);

function assertSquareConfigured() {
  if (!squareClient) {
    throw new Error(
      'Square payments are not configured. Please set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID.'
    );
  }
}

const cents = (amount = 0) => Math.max(0, Math.round(Number(amount || 0) * 100));
const toMoney = (amount, { isCents = false } = {}) => ({
  amount: BigInt(isCents ? Math.round(Number(amount || 0)) : cents(amount)),
  currency: SQUARE_CURRENCY,
});

export async function createSquareCheckoutSession({
  order,
  user,
  shippingAddress,
  redirectUrl,
}) {
  assertSquareConfigured();

  const checkoutClient = squareClient.checkout?.paymentLinks
    ? squareClient.checkout.paymentLinks
    : squareClient.checkout;

  if (!checkoutClient || typeof checkoutClient.create !== 'function') {
    throw new Error('Square checkout client unavailable');
  }

  const idempotencyKey = crypto.randomUUID();

  const lineItems = (order.items || []).map((item) => ({
    name: (item.productName || 'Custom Tee').substring(0, 255),
    quantity: String(item.quantity || 1),
    note: item.productType === 'custom' ? 'Custom design' : 'Catalog item',
    basePriceMoney: toMoney(item.price),
  }));

  if (order.shippingCost && order.shippingCost > 0) {
    lineItems.push({
      name: order.shippingServiceName || 'Shipping',
      quantity: '1',
      basePriceMoney: toMoney(order.shippingCost, { isCents: true }),
    });
  }

  const discounts = [];
  const discountAmount = order?.coupon?.discountAmount || 0;
  if (discountAmount > 0) {
    discounts.push({
      name: order.coupon?.code || 'Discount',
      scope: 'ORDER',
      type: 'FIXED_AMOUNT',
      amountMoney: toMoney(discountAmount),
    });
  }

  const squareOrder = {
    locationId: SQUARE_LOCATION_ID,
    referenceId: order._id.toString(),
    lineItems,
    discounts: discounts.length ? discounts : undefined,
  };

  const paymentLinkResponse = await checkoutClient.create({
    idempotencyKey,
    description: `CustomTees order ${order._id}`,
    order: squareOrder,
    checkoutOptions: {
      redirectUrl,
      askForShippingAddress: false,
    },
    prePopulatedData: {
      buyerEmail: user?.email,
      buyerPhoneNumber: shippingAddress?.phone,
      buyerAddress: shippingAddress
        ? {
            addressLine1: shippingAddress.line1,
            addressLine2: shippingAddress.line2,
            locality: shippingAddress.city,
            administrativeDistrictLevel1: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: (shippingAddress.country || 'US').toUpperCase(),
            firstName: shippingAddress.fullName?.split(' ')?.[0],
            lastName:
              shippingAddress.fullName?.split(' ')?.slice(1).join(' ') || shippingAddress.fullName,
          }
        : undefined,
    },
  });

  const paymentLink = paymentLinkResponse?.paymentLink;

  if (!paymentLink?.url) {
    throw new Error('Failed to create Square checkout session');
  }

  return {
    checkoutId: paymentLink.id,
    checkoutUrl: paymentLink.url,
    squareOrderId: paymentLink.orderId,
  };
}

export async function retrieveSquarePayment(paymentId) {
  assertSquareConfigured();
  const paymentsClient = squareClient.payments;
  const response = await paymentsClient.get({ paymentId });
  return response?.payment;
}


