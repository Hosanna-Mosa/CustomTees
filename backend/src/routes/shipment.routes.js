import { Router } from 'express';
import Order from '../models/Order.js';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { createUpsShipment } from '../services/ups.service.js';

const router = Router();

const validatePackageInfo = (payload = {}) => {
  const requiredFields = ['weight', 'length', 'width', 'height'];
  const missing = requiredFields.filter(
    (field) => payload[field] === undefined || payload[field] === null || payload[field] === ''
  );
  if (missing.length) {
    return `Missing package fields: ${missing.join(', ')}`;
  }

  const invalid = requiredFields.filter((field) => Number(payload[field]) <= 0 || Number.isNaN(Number(payload[field])));
  if (invalid.length) {
    return `Invalid package values for: ${invalid.join(', ')}`;
  }

  return null;
};

router.post('/create-label/:orderId', protect, verifyAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('[ShipmentRoute] Incoming label request', {
      orderId,
      payload: req.body,
      userId: req.user?._id?.toString(),
    });
    const validationError = validatePackageInfo(req.body);
    if (validationError) {
      console.warn('[ShipmentRoute] Validation failed', { orderId, validationError });
      return res.status(400).json({ success: false, message: validationError });
    }

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      console.warn('[ShipmentRoute] Order not found', { orderId });
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.shippingAddress) {
      console.warn('[ShipmentRoute] Missing shipping address', { orderId });
      return res.status(400).json({ success: false, message: 'Order is missing a shipping address' });
    }

    if (
      order.trackingNumber &&
      order.labelUrl &&
      (order.shipmentStatus === 'label_generated' || order.status === 'shipped') &&
      !req.query.force
    ) {
      console.log('[ShipmentRoute] Order already has label, returning existing data', {
        orderId,
        trackingNumber: order.trackingNumber,
        labelUrl: order.labelUrl,
      });
      return res.json({
        success: true,
        trackingNumber: order.trackingNumber,
        labelUrl: order.labelUrl,
        status: order.status,
        shipmentStatus: order.shipmentStatus,
        reused: true,
      });
    }

    console.log('[ShipmentRoute] Calling createUpsShipment', {
      orderId,
      shippingAddress: order.shippingAddress,
    });
    const shipmentResult = await createUpsShipment(order, req.body);
    console.log('[ShipmentRoute] UPS shipment success', {
      orderId,
      trackingNumber: shipmentResult.trackingNumber,
      labelUrl: shipmentResult.labelUrl,
      labelPublicId: shipmentResult.labelPublicId,
    });

    order.trackingNumber = shipmentResult.trackingNumber;
    order.labelUrl = shipmentResult.labelUrl;
    order.labelPublicId = shipmentResult.labelPublicId;
    order.shipmentStatus = 'label_generated';
    order.status = 'shipped';
    const savedOrder = await order.save();
    console.log('[ShipmentRoute] Order updated after label generation', {
      orderId,
      trackingNumber: savedOrder.trackingNumber,
      labelUrl: savedOrder.labelUrl,
      shipmentStatus: savedOrder.shipmentStatus,
      status: savedOrder.status,
    });

    return res.json({
      success: true,
      trackingNumber: order.trackingNumber,
      labelUrl: order.labelUrl,
      labelPublicId: order.labelPublicId,
      status: order.status,
      shipmentStatus: order.shipmentStatus,
    });
  } catch (error) {
    console.error('[Shipment] Failed to create UPS label:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate UPS shipping label',
    });
  }
});

export default router;

