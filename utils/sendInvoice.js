const nodemailer = require("nodemailer");

const sendInvoiceEmail = async (userEmail, orderData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: "multimartwebapp@gmail.com", pass: process.env.App_Pass },
    });

    const itemsHtml = orderData.items.map((item) => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f4f4f4;color:#334155;font-family:'DM Sans',Arial,sans-serif;font-size:14px;">${item.name}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f4f4f4;text-align:center;color:#475569;font-family:monospace;">${item.quantity}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f4f4f4;text-align:right;font-family:monospace;color:#0f1117;font-weight:600;">₹${(item.quantity * item.price).toLocaleString("en-IN")}</td>
      </tr>`
    ).join("");

    const mailOptions = {
      from: `"MyStore" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Your Order Receipt #${orderData.receiptNumber || orderData.orderId}`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

  <!-- Header -->
  <tr><td style="background:#0f1117;padding:28px 36px;">
    <table width="100%"><tr>
      <td><span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">My<span style="color:#4ade80;">Store</span></span></td>
      <td align="right" style="color:#94a3b8;font-size:12px;line-height:1.8;">
        <strong style="color:#e2e8f0;display:block;">Order Confirmed</strong>
        ID: ${orderData.orderId}<br/>
        Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </td>
    </tr></table>
  </td></tr>

  <!-- Thank you banner -->
  <tr><td style="background:#f0fdf4;padding:18px 36px;border-bottom:1px solid #dcfce7;">
    <p style="margin:0;font-size:14px;color:#16a34a;font-weight:500;">&#10003; &nbsp;Thank you for your order! It's being processed.</p>
  </td></tr>

  <!-- Addresses -->
  <tr><td style="padding:28px 36px;border-bottom:1px solid #f0f0f0;">
    <table width="100%"><tr valign="top">
      <td width="50%" style="padding-right:20px;">
        <p style="margin:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#94a3b8;font-weight:600;">Shipping To</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#0f1117;">${orderData.billingDetails.firstName} ${orderData.billingDetails.lastName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;line-height:1.8;">
          ${orderData.billingDetails.address1}<br/>
          ${orderData.billingDetails.city}, ${orderData.billingDetails.state} — ${orderData.billingDetails.zipCode}
        </p>
      </td>
      <td width="50%">
        <p style="margin:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#94a3b8;font-weight:600;">Payment</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#0f1117;">${orderData.paymentMethod}</p>
        <span style="display:inline-block;margin-top:6px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;font-size:11px;padding:3px 10px;border-radius:99px;font-family:monospace;">Confirmed</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Items table -->
  <tr><td style="padding:0 36px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <thead>
        <tr style="background:#f8f9fb;">
          <th style="padding:10px 16px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:500;border-bottom:1px solid #eee;">Product</th>
          <th style="padding:10px 16px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:500;border-bottom:1px solid #eee;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:500;border-bottom:1px solid #eee;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr style="background:#0f1117;">
          <td colspan="2" style="padding:16px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-family:monospace;">Amount Paid</td>
          <td style="padding:16px;text-align:right;color:#4ade80;font-size:18px;font-weight:700;font-family:monospace;">₹${orderData.amountPaid.toLocaleString("en-IN")}</td>
        </tr>
      </tfoot>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8f9fb;padding:20px 36px;border-top:1px solid #eee;">
    <p style="margin:0;font-size:11.5px;color:#64748b;line-height:1.9;">
      <strong style="color:#334155;">Sold by:</strong> MyStore Pvt Ltd &nbsp;|&nbsp; <strong style="color:#334155;">GSTIN:</strong> XXXXXXXX<br/>
      This is an auto-generated invoice. For help, contact <a href="mailto:support@mystore.com" style="color:#2563eb;">support@mystore.com</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Invoice email sent!");
  } catch (error) {
    console.error("Email error:", error);
  }
};

module.exports = sendInvoiceEmail;