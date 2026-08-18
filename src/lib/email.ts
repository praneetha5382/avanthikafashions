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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
        body { font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #fcfcfc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fcfcfc; padding: 40px 0 60px 0; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 720px; border-spacing: 0; color: #1a1a1a; border-radius: 0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #eeeeee; }
        .header { background-color: #ffffff; padding: 40px 50px 30px 50px; text-align: center; }
        .header img { max-width: 220px; height: auto; }
        .banner { background-color: #D80D5D; color: #ffffff; padding: 12px 50px; text-align: center; }
        .banner h2 { margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 50px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 32px; margin: 0 0 10px 0; font-weight: 600; color: #1a1a1a; }
        p { margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #444444; }
        
        .invoice-details { display: table; width: 100%; margin-bottom: 40px; }
        .invoice-col { display: table-cell; width: 50%; vertical-align: top; }
        .invoice-meta { border: 1px solid #eeeeee; padding: 20px; background: #fafafa; border-radius: 4px; }
        .invoice-meta table { width: 100%; border-collapse: collapse; }
        .invoice-meta td { padding: 4px 0; font-size: 13px; color: #333333; }
        .invoice-meta td.label { font-weight: 600; width: 45%; color: #888888; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .items-table th { text-align: left; padding: 12px 0; border-bottom: 2px solid #1a1a1a; color: #1a1a1a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }
        .items-table td { padding: 20px 0; border-bottom: 1px solid #eeeeee; vertical-align: middle; }
        .item-image { width: 80px; overflow: hidden; }
        .item-image img { width: 100%; height: auto; display: block; }
        .item-details { padding-left: 20px; }
        .item-name { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 20px; color: #1a1a1a; margin-bottom: 6px; display: block; }
        .item-meta { font-size: 13px; color: #666666; line-height: 1.5; }
        .item-price { text-align: right; font-weight: 500; font-size: 16px; color: #1a1a1a; }
        
        .totals-wrapper { width: 100%; display: table; margin-bottom: 40px; }
        .totals-spacer { display: table-cell; width: 50%; }
        .totals-box { display: table-cell; width: 50%; padding-left: 30px; }
        .totals-table { width: 100%; border-collapse: collapse; }
        .totals-table td { padding: 10px 0; font-size: 14px; color: #444444; text-align: right; }
        .totals-table td.label { width: 60%; padding-right: 20px; text-align: left; }
        .totals-table tr.total td { padding-top: 15px; border-top: 1px solid #1a1a1a; font-size: 18px; font-weight: 600; color: #D80D5D; }
        .totals-table tr.discount td { color: #D80D5D; }
        
        .shipping-box { border-top: 1px solid #eeeeee; padding-top: 30px; margin-bottom: 40px; }
        .shipping-box h3 { font-family: 'Cormorant Garamond', serif; margin: 0 0 15px 0; font-size: 22px; color: #1a1a1a; font-weight: 600; }
        .shipping-box p { margin: 0; font-size: 14px; color: #444444; line-height: 1.6; }
        
        .action-container { text-align: center; margin: 40px 0 10px 0; }
        .btn { display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 40px; font-weight: 500; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; transition: background 0.2s; border-radius: 2px; }
        
        .footer { text-align: center; padding: 30px; color: #888888; font-size: 12px; line-height: 1.6; }
        .footer a { color: #D80D5D; text-decoration: none; }
      </style>
    </head>
    <body>
      <center class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td class="header">
              <a href="https://avanthikafashions.com" target="_blank">
                <img src="https://avanthikafashions.com/logo.png" alt="Avanthika Fashions" width="220">
              </a>
            </td>
          </tr>
          <tr>
            <td class="banner">
              <h2>Official Receipt</h2>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h1>Thank You, ${order.customer_name}.</h1>
              <p style="margin-bottom: 30px;">Your magnificent selections from Avanthika Fashions are confirmed. We are carefully preparing your items for dispatch. Below is your official receipt.</p>
              
              <div class="invoice-details">
                <div class="invoice-col" style="padding-right: 15px;">
                  <div class="invoice-meta" style="height: 100%;">
                    <table>
                      <tr><td class="label">Receipt No:</td><td><strong>${order.id.replace('ORD-', 'AF-')}</strong></td></tr>
                      <tr><td class="label">Date Issued:</td><td>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                      <tr><td class="label">Payment By:</td><td>${order.payment_method.toUpperCase()}</td></tr>
                    </table>
                  </div>
                </div>
                <div class="invoice-col" style="padding-left: 15px;">
                  <div class="invoice-meta" style="height: 100%;">
                    <table>
                      <tr><td class="label">Billed To:</td><td><strong>${order.customer_name}</strong></td></tr>
                      <tr><td class="label">Email:</td><td>${order.customer_email || 'Provided at checkout'}</td></tr>
                      <tr><td class="label">Phone:</td><td>${order.customer_phone}</td></tr>
                    </table>
                  </div>
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th colspan="2">Product Details</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item: any) => `
                    <tr>
                      <td style="width: 80px;">
                        <div class="item-image">
                          <img src="${item.image || 'https://avanthikafashions.com/placeholder.jpg'}" alt="${item.name}" width="80">
                        </div>
                      </td>
                      <td class="item-details">
                        <span class="item-name">${item.name}</span>
                        <span class="item-meta">
                          <strong>Variation:</strong> ${item.size} <br>
                          <strong>Quantity:</strong> ${item.quantity} <br>
                          <strong>Article ID:</strong> ${item.sku || item.id}
                        </span>
                      </td>
                      <td class="item-price">
                        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="totals-wrapper">
                <div class="totals-spacer"></div>
                <div class="totals-box">
                  <table class="totals-table">
                    <tr><td class="label">Subtotal</td><td>₹${order.subtotal?.toLocaleString('en-IN')}</td></tr>
                    <tr><td class="label">Shipping</td><td>${order.shipping_cost === 0 ? 'Complimentary' : `₹${order.shipping_cost?.toLocaleString('en-IN')}`}</td></tr>
                    ${order.discount ? `<tr class="discount"><td class="label">Special Offer</td><td>-₹${order.discount.toLocaleString('en-IN')}</td></tr>` : ''}
                    <tr class="total"><td class="label">Grand Total</td><td>₹${order.total?.toLocaleString('en-IN')}</td></tr>
                  </table>
                </div>
              </div>

              <div class="shipping-box">
                <h3>Delivery Destination</h3>
                <p>
                  <strong>${order.customer_name}</strong><br>
                  ${order.shipping_address.address}<br>
                  ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pin}<br>
                  India
                </p>
              </div>

              <div class="action-container">
                <a href="https://avanthikafashions.com/account" class="btn">Track Package</a>
              </div>
            </td>
          </tr>
        </table>
        
        <div class="footer">
          <p>If you have any inquiries regarding this receipt, please contact us at <br><a href="mailto:getreelife@gmail.com" style="font-weight: 500;">getreelife@gmail.com</a></p>
          <p>&copy; ${new Date().getFullYear()} Avanthika Fashions. Authentic Premium Collections.</p>
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
