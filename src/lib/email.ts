import nodemailer from 'nodemailer';

// Initialize the transporter only if the environment variable is present
// We will gracefully fail and log to console if not setup yet.
const transporter = process.env.SMTP_PASSWORD ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'getreelife@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
}) : null;

export const sendOrderConfirmationEmail = async (order: any) => {
  const customerEmail = order.customer_email;
  if (!customerEmail) {
    console.log(`[Email System] No email provided for order ${order.id}. Skipping confirmation email.`);
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f5; padding-bottom: 60px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #171a1b; border-radius: 8px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #ffffff; padding: 30px 40px; text-align: center; border-bottom: 1px solid #f0f0f0; }
        .header img { max-width: 180px; height: auto; }
        .banner { background-color: #c1121f; color: #ffffff; padding: 15px 40px; text-align: center; }
        .banner h2 { margin: 0; font-size: 18px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px; }
        h1 { font-size: 24px; margin: 0 0 20px 0; font-weight: 600; color: #111827; }
        p { margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #4b5563; }
        .order-meta { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #f3f4f6; }
        .order-meta table { width: 100%; border-collapse: collapse; }
        .order-meta td { padding: 5px 0; font-size: 14px; color: #374151; }
        .order-meta td.label { font-weight: 600; width: 40%; color: #6b7280; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { text-align: left; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600; }
        .items-table td { padding: 20px 0; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
        .item-image { width: 70px; border-radius: 6px; overflow: hidden; }
        .item-image img { width: 100%; height: auto; display: block; border-radius: 6px; }
        .item-details { padding-left: 15px; }
        .item-name { font-weight: 600; font-size: 15px; color: #111827; margin-bottom: 4px; display: block; }
        .item-meta { font-size: 13px; color: #6b7280; }
        .item-price { text-align: right; font-weight: 600; font-size: 15px; color: #111827; }
        
        .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .totals-table td { padding: 8px 0; font-size: 15px; color: #4b5563; text-align: right; }
        .totals-table td.label { width: 70%; padding-right: 20px; }
        .totals-table tr.total td { padding-top: 15px; border-top: 2px solid #e5e7eb; font-size: 18px; font-weight: 700; color: #111827; }
        .totals-table tr.discount td { color: #10b981; }
        
        .shipping-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .shipping-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
        .shipping-box p { margin: 0; font-size: 15px; color: #111827; line-height: 1.5; }
        
        .action-container { text-align: center; margin: 40px 0 20px 0; }
        .btn { display: inline-block; background-color: #c1121f; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; }
        
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 13px; }
        .footer a { color: #c1121f; text-decoration: none; }
      </style>
    </head>
    <body>
      <center class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td class="header">
              <a href="https://avanthikafashions.com" target="_blank">
                <img src="https://avanthikafashions.com/logo.png" alt="Avanthika Fashions" width="180">
              </a>
            </td>
          </tr>
          <tr>
            <td class="banner">
              <h2>Order Confirmed</h2>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h1>Hi ${order.customer_name},</h1>
              <p>Thank you for choosing Avanthika Fashions! We have received your order and are currently preparing it for dispatch. You will receive another notification once your package has shipped.</p>
              
              <div class="order-meta">
                <table>
                  <tr><td class="label">Order ID:</td><td><strong>${order.id}</strong></td></tr>
                  <tr><td class="label">Date:</td><td>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                  <tr><td class="label">Payment Method:</td><td>${order.payment_method.toUpperCase()}</td></tr>
                </table>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th colspan="2">Item</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item: any) => `
                    <tr>
                      <td style="width: 70px;">
                        <div class="item-image">
                          <img src="${item.image || 'https://avanthikafashions.com/placeholder.jpg'}" alt="${item.name}" width="70">
                        </div>
                      </td>
                      <td class="item-details">
                        <span class="item-name">${item.name}</span>
                        <span class="item-meta">
                          Color/Size: ${item.size} <br>
                          Qty: ${item.quantity} <br>
                          SKU: ${item.sku || item.id}
                        </span>
                      </td>
                      <td class="item-price">
                        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <table class="totals-table">
                <tr><td class="label">Subtotal</td><td>₹${order.subtotal?.toLocaleString('en-IN')}</td></tr>
                <tr><td class="label">Shipping</td><td>${order.shipping_cost === 0 ? 'Free' : `₹${order.shipping_cost?.toLocaleString('en-IN')}`}</td></tr>
                ${order.discount ? `<tr class="discount"><td class="label">Discount applied</td><td>-₹${order.discount.toLocaleString('en-IN')}</td></tr>` : ''}
                <tr class="total"><td class="label">Total</td><td>₹${order.total?.toLocaleString('en-IN')}</td></tr>
              </table>

              <div class="shipping-box">
                <h3>Delivery Address</h3>
                <p>
                  <strong>${order.customer_name}</strong><br>
                  ${order.shipping_address.address}<br>
                  ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pin}<br>
                  ${order.customer_phone}
                </p>
              </div>

              <div class="action-container">
                <a href="https://avanthikafashions.com/account" class="btn">View Your Order</a>
              </div>
            </td>
          </tr>
        </table>
        
        <div class="footer">
          <p>Need help? Reply to this email or contact us at <a href="mailto:getreelife@gmail.com">getreelife@gmail.com</a></p>
          <p>&copy; ${new Date().getFullYear()} Avanthika Fashions. All rights reserved.</p>
        </div>
      </center>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Avanthika Fashions" <${process.env.SMTP_EMAIL || 'helloreelifeweddings@gmail.com'}>`,
        to: customerEmail,
        subject: `Order Confirmation - ${order.id}`,
        html: emailHtml,
      });
      console.log(`[Email System] Order confirmation email sent to ${customerEmail}`);
    } catch (error) {
      console.error(`[Email System] Failed to send email to ${customerEmail}:`, error);
    }
  } else {
    console.log(`[Email System/MOCK] Would have sent order confirmation to ${customerEmail}. Please configure SMTP_PASSWORD in .env.local`);
  }
};

export const sendOrderStatusEmail = async (order: any) => {
  const customerEmail = order.customer_email;
  if (!customerEmail) return;

  const statusColor = order.status === 'Delivered' ? '#10b981' : order.status === 'Shipped' ? '#3b82f6' : '#f59e0b';
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #c1121f;">Avanthika Fashions</h1>
        <h2 style="color: #333;">Order Update</h2>
      </div>
      
      <p>Hi ${order.customer_name},</p>
      <p>Great news! The status of your order <strong>${order.id}</strong> has been updated.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 30px; font-weight: bold; font-size: 1.2rem; text-transform: uppercase;">
          ${order.status}
        </span>
      </div>

      ${order.status === 'Shipped' && order.shipping_address?.tracking ? `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; margin-bottom: 25px;">
        <p style="margin: 0 0 5px 0; color: #64748b;">Shipped via <strong>${order.shipping_address.tracking.courier}</strong></p>
        <p style="margin: 0; font-size: 1.1rem; font-weight: bold;">Tracking ID: ${order.shipping_address.tracking.trackingId}</p>
        <div style="margin-top: 15px;">
          <a href="https://www.google.com/search?q=${order.shipping_address.tracking.courier}+tracking+${order.shipping_address.tracking.trackingId}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Track on Google</a>
        </div>
      </div>
      ` : ''}

      <div style="margin-top: 30px; text-align: center;">
        <a href="https://avanthikafashions.vercel.app/account" style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Order Tracking</a>
      </div>
      
      <p style="text-align: center; color: #888; font-size: 0.8rem; margin-top: 40px;">
        Thank you for shopping with us!
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Avanthika Fashions" <${process.env.SMTP_EMAIL || 'helloreelifeweddings@gmail.com'}>`,
        to: customerEmail,
        subject: `Order Update: ${order.status} - ${order.id}`,
        html: emailHtml,
      });
      console.log(`[Email System] Order status email sent to ${customerEmail}`);
    } catch (error) {
      console.error(`[Email System] Failed to send status email to ${customerEmail}:`, error);
    }
  } else {
    console.log(`[Email System/MOCK] Would have sent status update ${order.status} to ${customerEmail}.`);
  }
};
