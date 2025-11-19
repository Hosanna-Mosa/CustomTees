import Order from '../models/Order.js';
import CheckoutSession from '../models/CheckoutSession.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { isSquareConfigured, retrieveSquarePayment } from '../services/square.service.js';

const incrementCouponUsage = async (couponDoc) => {
  if (!couponDoc) return;
  couponDoc.usedCount += 1;
  await couponDoc.save();
};

const finalizeSquareOrderFromSession = async ({ session, payment, squareOrderIdOverride }) => {
  const order = await Order.create({
    user: session.user,
    items: session.items,
    total: session.total,
    paymentMethod: 'square',
    payment: {
      provider: 'square',
      status: 'pending',
      squareCheckoutId: session.payment?.squareCheckoutId,
      squareOrderId: squareOrderIdOverride || session.payment?.squareOrderId,
      checkoutUrl: session.payment?.checkoutUrl,
    },
    shippingAddress: session.shippingAddress,
    coupon: session.coupon
      ? {
          code: session.coupon.code,
          discountAmount: session.coupon.discountAmount,
        }
      : undefined,
    shippingCost: session.shippingCost,
  });

  order.payment.status = 'paid';
  order.payment.squarePaymentId = payment.id;
  order.payment.squareOrderId = payment.orderId || order.payment.squareOrderId;
  order.payment.failureReason = undefined;
  order.status = 'processing';
  await order.save();

  if (session.coupon?.id) {
    const couponDoc = await Coupon.findById(session.coupon.id);
    await incrementCouponUsage(couponDoc);
  }

  const user = await User.findById(session.user);
  if (user) {
    user.cart = [];
    await user.save();
  }

  session.status = 'completed';
  session.payment = {
    ...(session.payment || {}),
    status: 'paid',
    squarePaymentId: payment.id,
    squareOrderId: order.payment.squareOrderId,
    failureReason: undefined,
  };
  session.order = order._id;
  await session.save();

  return order;
};

export const verifySquarePayment = async (req, res) => {
  try {
    if (!isSquareConfigured()) {
      return res.status(500).json({ success: false, message: 'Square payments are not configured' });
    }

    const { sessionId, orderId, transactionId, squareOrderId, status } = req.body;

    if (sessionId) {
      const session = await CheckoutSession.findById(sessionId);

      if (!session) {
        return res.status(404).json({ success: false, message: 'Checkout session not found' });
      }

      if (String(session.user) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied for this session' });
      }

      if (session.status === 'completed' && session.order) {
        const existingOrder = await Order.findById(session.order);
        if (existingOrder) {
          return res.json({
            success: true,
            data: {
              order: existingOrder,
              paymentStatus: 'paid',
              squareStatus: 'COMPLETED',
            },
          });
        }
      }

      if (!transactionId) {
        session.status = 'failed';
        session.payment = {
          ...(session.payment || {}),
          status: status === 'cancelled' ? 'cancelled' : 'failed',
          failureReason: status === 'cancelled' ? 'Customer cancelled Square checkout' : 'Missing Square transaction ID',
        };
        await session.save();

        return res.json({
          success: true,
          data: {
            order: null,
            paymentStatus: 'failed',
            squareStatus: status || 'CANCELLED',
          },
        });
      }

      const payment = await retrieveSquarePayment(transactionId);

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Square payment not found' });
      }

      const squareStatus = payment?.status;

      if (squareStatus === 'COMPLETED') {
        const order = await finalizeSquareOrderFromSession({
          session,
          payment,
          squareOrderIdOverride: squareOrderId,
        });

        return res.json({
          success: true,
          data: {
            order,
            paymentStatus: 'paid',
            squareStatus,
          },
        });
      }

      session.status = 'failed';
      session.payment = {
        ...(session.payment || {}),
        status: 'failed',
        squarePaymentId: transactionId,
        failureReason: payment?.cardDetails?.status || squareStatus || 'Square payment failed',
      };
      await session.save();

      return res.json({
        success: true,
        data: {
          order: null,
          paymentStatus: 'failed',
          squareStatus,
        },
      });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied for this order' });
    }

    if (order.paymentMethod !== 'square') {
      return res.status(400).json({ success: false, message: 'Order was not paid with Square' });
    }

    if (!transactionId) {
      order.payment.status = 'failed';
      order.payment.failureReason = status === 'cancelled'
        ? 'Customer cancelled Square checkout'
        : 'Missing Square transaction ID';
      await order.save();

      return res.json({
        success: true,
        data: {
          order,
          paymentStatus: order.payment.status,
        },
      });
    }

    const payment = await retrieveSquarePayment(transactionId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Square payment not found' });
    }

    const squareStatus = payment?.status;

    if (squareStatus === 'COMPLETED') {
      order.payment.status = 'paid';
      order.payment.squarePaymentId = payment.id;
      order.payment.squareOrderId = payment.orderId || squareOrderId || order.payment.squareOrderId;
      order.payment.failureReason = undefined;
      order.status = 'processing';
    } else {
      order.payment.status = 'failed';
      order.payment.failureReason = payment?.cardDetails?.status || squareStatus || 'Square payment failed';
    }

    await order.save();

    return res.json({
      success: true,
      data: {
        order,
        paymentStatus: order.payment.status,
        squareStatus,
      },
    });
  } catch (error) {
    console.error('[Payments] verifySquarePayment failed:', error);
    return res.status(502).json({
      success: false,
      message: error?.message || 'Unable to verify Square payment',
    });
  }
};


