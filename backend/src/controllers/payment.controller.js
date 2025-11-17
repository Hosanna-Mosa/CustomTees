import Order from '../models/Order.js';
import { isSquareConfigured, retrieveSquarePayment } from '../services/square.service.js';

export const verifySquarePayment = async (req, res) => {
  try {
    if (!isSquareConfigured()) {
      return res.status(500).json({ success: false, message: 'Square payments are not configured' });
    }

    const { orderId, transactionId, squareOrderId, status } = req.body;

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


