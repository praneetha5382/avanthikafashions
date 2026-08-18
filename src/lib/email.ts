import nodemailer from 'nodemailer';

// Initialize the transporter only if the environment variable is present
// We will gracefully fail and log to console if not setup yet.
const transporter = process.env.SMTP_PASSWORD ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'helloreelifeweddings@gmail.com',
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #c1121f;">Avanthika Fashions</h1>
        <h2 style="color: #333;">Order Confirmation</h2>
      </div>
      
      <p>Hi ${order.customer_name},</p>
      <p>Thank you for your order! We've received it and are getting it ready for you.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> ${order.id}</p>
        <p style="margin: 0 0 10px 0;"><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
        <p style="margin: 0 0 10px 0;"><strong>Total Amount:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
      </div>

      <h3 style="border-bottom: 1px solid #eaeaea; padding-bottom: 5px;">Items Ordered</h3>
      <ul style="list-style: none; padding: 0;">
        ${order.items.map((item: any) => `
          <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
            <div>
              <strong>${item.quantity}x ${item.name}</strong> ${item.size !== 'Standard' ? `(${item.size})` : ''}
              <br/><span style="color: #666; font-size: 12px;">SKU: ${item.sku || item.id}</span>
            </div>
            <strong>₹${(item.price * item.quantity).toLocaleString('en-IN')}</strong>
          </li>
        `).join('')}
      </ul>

      <div style="margin-top: 15px; border-top: 1px solid #eaeaea; padding-top: 10px; text-align: right;">
        <p style="margin: 0 0 5px 0;">Subtotal: ₹${order.subtotal?.toLocaleString('en-IN')}</p>
        <p style="margin: 0 0 5px 0;">Shipping: ₹${order.shipping_cost?.toLocaleString('en-IN')}</p>
        ${order.discount ? `<p style="margin: 0 0 5px 0; color: #16a34a;">Discount: -₹${order.discount.toLocaleString('en-IN')}</p>` : ''}
        <h3 style="margin: 10px 0 0 0; font-size: 18px;">TOTAL: ₹${order.total?.toLocaleString('en-IN')}</h3>
      </div>

      <h3 style="border-bottom: 1px solid #eaeaea; padding-bottom: 5px; margin-top: 20px;">Shipping Address</h3>
      <p style="margin: 0; line-height: 1.5;">
        ${order.shipping_address.address}<br>
        ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pin}
      </p>

      <div style="margin-top: 30px; text-align: center;">
        <a href="https://avanthikafashions.vercel.app/account" style="background: #c1121f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Track Your Order</a>
      </div>
      
      <p style="text-align: center; color: #888; font-size: 0.8rem; margin-top: 40px;">
        Avanthika Fashions &copy; ${new Date().getFullYear()}<br>
        If you have any questions, reply to this email!
      </p>
    </div>
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
