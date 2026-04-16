module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    });

    // Join vendor room
    socket.on('join_vendor', (vendorId) => {
      socket.join(`vendor_${vendorId}`);
      console.log(`🏪 Vendor ${vendorId} joined their room`);
    });

    // Join order tracking room
    socket.on('join_order_tracking', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`📦 Tracking order: ${orderId}`);
    });

    // Delivery partner location update
    socket.on('delivery_location', (data) => {
      const { orderId, lat, lng } = data;
      io.to(`order_${orderId}`).emit('location_update', { lat, lng, timestamp: new Date() });
    });

    // Leave rooms
    socket.on('leave_order_tracking', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
