const { assignDeliveryman } = require('../controllers/order.controller');
const Order = require('../models/order.model');
const Deliveryman = require('../models/deliveryman.model');

jest.mock('../models/order.model');
jest.mock('../models/deliveryman.model');

describe('Order Controller - assignDeliveryman', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (params = {}, body = {}) => ({
    params,
    body
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('should successfully assign a deliveryman to an order', async () => {
    const orderId = 'order123';
    const deliverymanId = 'deliveryman123';

    const mockOrder = {
      _id: orderId,
      deliveryMethod: 'Home Delivery',
      save: jest.fn().mockResolvedValue(true)
    };

    const mockDeliveryman = {
      _id: deliverymanId,
      name: 'John Doe',
      approved: true,
      status: 'available'
    };

    Order.findById = jest.fn().mockResolvedValue(mockOrder);
    Deliveryman.findById = jest.fn().mockResolvedValue(mockDeliveryman);

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(Deliveryman.findById).toHaveBeenCalledWith(deliverymanId);
    expect(mockOrder.deliverymanId).toBe(deliverymanId);
    expect(mockOrder.deliverymanName).toBe('John Doe');
    expect(mockOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Deliveryman assigned successfully',
      order: mockOrder
    });
  });

  test('should return 404 if order is not found', async () => {
    const orderId = 'nonexistent';
    const deliverymanId = 'deliveryman123';

    Order.findById = jest.fn().mockResolvedValue(null);

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
  });

  test('should return 400 if order is not for home delivery', async () => {
    const orderId = 'order123';
    const deliverymanId = 'deliveryman123';

    const mockOrder = {
      _id: orderId,
      deliveryMethod: 'Take-away'
    };

    Order.findById = jest.fn().mockResolvedValue(mockOrder);

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'This order is not for home delivery' });
  });

  test('should return 404 if deliveryman is not found', async () => {
    const orderId = 'order123';
    const deliverymanId = 'nonexistent';

    const mockOrder = {
      _id: orderId,
      deliveryMethod: 'Home Delivery'
    };

    Order.findById = jest.fn().mockResolvedValue(mockOrder);
    Deliveryman.findById = jest.fn().mockResolvedValue(null);

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(Deliveryman.findById).toHaveBeenCalledWith(deliverymanId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Deliveryman not found' });
  });

  test('should return 400 if deliveryman is not approved', async () => {
    const orderId = 'order123';
    const deliverymanId = 'deliveryman123';

    const mockOrder = {
      _id: orderId,
      deliveryMethod: 'Home Delivery'
    };

    const mockDeliveryman = {
      _id: deliverymanId,
      name: 'John Doe',
      approved: false,
      status: 'available'
    };

    Order.findById = jest.fn().mockResolvedValue(mockOrder);
    Deliveryman.findById = jest.fn().mockResolvedValue(mockDeliveryman);

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(Deliveryman.findById).toHaveBeenCalledWith(deliverymanId);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'This deliveryman is not approved yet' });
  });

  test('should return 400 if deliveryman is not available', async () => {
    const orderId = 'order123';
    const deliverymanId = 'deliveryman123';

    const mockOrder = {
      _id: orderId,
      deliveryMethod: 'Home Delivery'
    };

    const mockDeliveryman = {
      _id: deliverymanId,
      name: 'John Doe',
      approved: true,
      status: 'delivering an order'
    };

    Order.findById = jest.fn().mockResolvedValue(mockOrder);
    Deliveryman.findById = jest.fn().mockResolvedValue(mockDeliveryman);

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(Deliveryman.findById).toHaveBeenCalledWith(deliverymanId);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'This deliveryman is not available' });
  });

  test('should handle server errors', async () => {
    const orderId = 'order123';
    const deliverymanId = 'deliveryman123';

    const errorMessage = 'Database connection failed';
    Order.findById = jest.fn().mockRejectedValue(new Error(errorMessage));

    const req = mockRequest({ orderId }, { deliverymanId });
    const res = mockResponse();

    console.error = jest.fn();

    await assignDeliveryman(req, res);

    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(console.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to assign deliveryman',
      error: errorMessage
    });
  });

  test('should prevent assigning an already occupied deliveryman to multiple orders', async () => {
    const orderId1 = 'order123';
    const deliverymanId = 'deliveryman123';

    const mockOrder1 = {
      _id: orderId1,
      deliveryMethod: 'Home Delivery',
      save: jest.fn().mockResolvedValue(true)
    };

    const mockDeliveryman = {
      _id: deliverymanId,
      name: 'John Doe',
      approved: true,
      status: 'available'
    };

    Order.findById = jest.fn().mockResolvedValueOnce(mockOrder1);
    Deliveryman.findById = jest.fn().mockResolvedValueOnce(mockDeliveryman);

    const req1 = mockRequest({ orderId: orderId1 }, { deliverymanId });
    const res1 = mockResponse();

    await assignDeliveryman(req1, res1);

    expect(res1.status).toHaveBeenCalledWith(200);

    const orderId2 = 'order456';

    const mockOrder2 = {
      _id: orderId2,
      deliveryMethod: 'Home Delivery',
      save: jest.fn().mockResolvedValue(true)
    };

    const updatedMockDeliveryman = {
      _id: deliverymanId,
      name: 'John Doe',
      approved: true,
      status: 'delivering an order'
    };

    Order.findById = jest.fn().mockResolvedValueOnce(mockOrder2);
    Deliveryman.findById = jest.fn().mockResolvedValueOnce(updatedMockDeliveryman);

    const req2 = mockRequest({ orderId: orderId2 }, { deliverymanId });
    const res2 = mockResponse();

    await assignDeliveryman(req2, res2);

    expect(res2.status).toHaveBeenCalledWith(400);
    expect(res2.json).toHaveBeenCalledWith({
      message: 'This deliveryman is already assigned to another order'
    });
  });
});
