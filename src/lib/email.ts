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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; overflow: hidden; }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #eaeaea; }
        .header img { max-width: 180px; }
        .content { padding: 40px 30px; color: #333333; }
        h1 { font-size: 24px; font-weight: 600; margin: 0 0 10px 0; color: #111111; }
        p { font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #555555; }
        
        .order-meta { background: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .order-meta table { width: 100%; border-collapse: collapse; }
        .order-meta td { padding: 6px 0; font-size: 14px; }
        .order-meta .label { color: #888888; width: 40%; }
        .order-meta .val { color: #111111; font-weight: 500; }
        
        .items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items th { text-align: left; padding-bottom: 15px; border-bottom: 1px solid #eaeaea; color: #888888; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .items td { padding: 20px 0; border-bottom: 1px solid #eaeaea; }
        .items .img-col { width: 60px; }
        .items img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }
        .items .details { padding-left: 15px; }
        .items .name { font-size: 15px; font-weight: 500; color: #111111; margin: 0 0 4px 0; }
        .items .meta { font-size: 13px; color: #888888; margin: 0; }
        .items .price { text-align: right; font-weight: 500; font-size: 15px; color: #111111; }
        
        .totals { width: 100%; margin-bottom: 40px; }
        .totals table { width: 100%; max-width: 300px; margin-left: auto; border-collapse: collapse; }
        .totals td { padding: 8px 0; font-size: 14px; text-align: right; }
        .totals .label { color: #555555; text-align: left; }
        .totals .total-row td { border-top: 2px solid #eaeaea; padding-top: 15px; font-weight: 600; font-size: 16px; color: #111111; }
        
        .shipping { background: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .shipping h3 { margin: 0 0 10px 0; font-size: 16px; color: #111111; }
        .shipping p { margin: 0; font-size: 14px; color: #555555; line-height: 1.5; }
        
        .actions { text-align: center; margin: 40px 0 20px 0; }
        .btn { display: inline-block; background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 15px; }
        
        .footer { padding: 30px; text-align: center; border-top: 1px solid #eaeaea; background-color: #fafafa; }
        .footer p { margin: 0; font-size: 13px; color: #888888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="https://avanthikafashions.com" target="_blank">
            <img src="https://avanthikafashions.com/logo.png" alt="Avanthika Fashions">
          </a>
        </div>
        <div class="content">
          <h1>Order Confirmed!</h1>
          <p>Hi ${order.customer_name}, thanks for shopping with us. We've received your order and are getting it ready to ship.</p>
          
          <div class="order-meta">
            <table>
              <tr><td class="label">Order ID</td><td class="val">${order.id}</td></tr>
              <tr><td class="label">Date</td><td class="val">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td class="label">Payment Method</td><td class="val">${order.payment_method.toUpperCase()}</td></tr>
            </table>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th colspan="2">Item</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td class="img-col">
                    <img src="${item.image || 'https://avanthikafashions.com/placeholder.jpg'}" alt="${item.name}">
                  </td>
                  <td class="details">
                    <p class="name">${item.name}</p>
                    <p class="meta">Qty: ${item.quantity} &nbsp;|&nbsp; Size: ${item.size}</p>
                  </td>
                  <td class="price">
                    ₹${(item.price * item.quantity).toLocaleString('en-IN')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr><td class="label">Subtotal</td><td>₹${order.subtotal?.toLocaleString('en-IN')}</td></tr>
              <tr><td class="label">Shipping</td><td>${order.shipping_cost === 0 ? 'Free' : `₹${order.shipping_cost?.toLocaleString('en-IN')}`}</td></tr>
              ${order.discount ? `<tr><td class="label">Discount</td><td style="color:#10b981;">-₹${order.discount.toLocaleString('en-IN')}</td></tr>` : ''}
              <tr class="total-row"><td class="label">Total</td><td>₹${order.total?.toLocaleString('en-IN')}</td></tr>
            </table>
          </div>

          <div class="shipping">
            <h3>Shipping Address</h3>
            <p>
              ${order.customer_name}<br>
              ${order.shipping_address.address}<br>
              ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pin}<br>
              Phone: ${order.customer_phone}
            </p>
          </div>

          <div class="actions">
            <a href="https://avanthikafashions.vercel.app/account" class="btn">Track Your Order</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Avanthika Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: '"Avanthika Fashions" <getreelife@gmail.com>',
        to: customerEmail,
        subject: `Order Confirmed: ${order.id}`,
        html: emailHtml,
      });
      console.log(`[Email System] Order confirmation email sent to ${customerEmail}`);
    } catch (error) {
      console.error(`[Email System] Failed to send email to ${customerEmail}:`, error);
    }
  } else {
    console.log(`[Email System/MOCK] Would have sent order confirmation to ${customerEmail}.`);
  }
};

export const sendOrderStatusEmail = async (order: any) => {
  const customerEmail = order.customer_email;
  if (!customerEmail) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; overflow: hidden; }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #eaeaea; }
        .header img { max-width: 180px; }
        .content { padding: 40px 30px; color: #333333; text-align: center; }
        h1 { font-size: 22px; font-weight: 600; margin: 0 0 10px 0; color: #111111; }
        p { font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #555555; }
        
        .status-badge { display: inline-block; background-color: #000000; color: #ffffff; padding: 8px 16px; border-radius: 4px; font-weight: 600; font-size: 14px; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
        
        .tracking-box { margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 6px; border: 1px solid #eaeaea; }
        .tracking-box p { margin: 0 0 10px 0; }
        .tracking-id { font-size: 18px; font-weight: 600; color: #111111; }
        
        .actions { margin: 40px 0 20px 0; }
        .btn { display: inline-block; background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 15px; }
        
        .footer { padding: 30px; text-align: center; border-top: 1px solid #eaeaea; background-color: #fafafa; }
        .footer p { margin: 0; font-size: 13px; color: #888888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="https://avanthikafashions.com" target="_blank">
            <img src="https://avanthikafashions.com/logo.png" alt="Avanthika Fashions">
          </a>
        </div>
        <div class="content">
          <h1>Order Update</h1>
          <p>Hi ${order.customer_name}, the status of your order <strong>${order.id}</strong> has been updated.</p>
          
          <div class="status-badge">${order.status}</div>
          
          ${order.status === 'Shipped' && order.shipping_address?.tracking ? `
            <div class="tracking-box">
              <p>Your order has been shipped via <strong>${order.shipping_address.tracking.courier}</strong>.</p>
              <p class="tracking-id">${order.shipping_address.tracking.trackingId}</p>
            </div>
          ` : ''}

          <div class="actions">
            <a href="https://avanthikafashions.vercel.app/account" class="btn">Track Your Order</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Avanthika Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: '"Avanthika Fashions" <getreelife@gmail.com>',
        to: customerEmail,
        subject: `Order Update: ${order.status} - ${order.id}`,
        html: emailHtml,
      });
      console.log(`[Email System] Order status email sent to ${customerEmail}`);
    } catch (error) {
      console.error(`[Email System] Failed to send status email to ${customerEmail}:`, error);
    }
  } else {
    console.log(`[Email System/MOCK] Would have sent status update to ${customerEmail}.`);
  }
};
