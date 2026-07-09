import React from "react";
import { Heading, Text, Hr } from "react-email";
import EmailLayout from "./email-layout";

type OrderItem = {
  title: string;
  quantity: number;
  price: number;
};

type Props = {
  customerName: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
};

export default function OrderConfirmation({ 
  customerName = "Customer", 
  orderId = "order_12345", 
  items = [], 
  totalAmount = 0 
}: Props) {
  return (
    <EmailLayout>
      <Heading className="text-2xl font-bold text-zinc-100">Order Confirmed! 🍿</Heading>
      
      <Text className="text-sm text-zinc-300 mt-4">
        Hi {customerName},
      </Text>
      <Text className="text-sm text-zinc-300">
        Thank you for your purchase from Lonely Rider Movie Portal. Your order has been successfully processed.
      </Text>

      <Hr className="border-zinc-800 my-6" />

      <Heading as="h3" className="text-sm font-semibold text-zinc-300 mb-2">Order Summary</Heading>
      
      {/* HTML Table for Itemized List (Gmail friendly) */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse", marginTop: "10px" }}>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #27272a" }}>
              <td style={{ padding: "10px 0", fontSize: "14px", color: "#e4e4e7", textAlign: "left" }}>
                <span style={{ fontWeight: "bold" }}>{item.title}</span>
                <span style={{ color: "#71717a", fontSize: "12px", marginLeft: "6px" }}>(x{item.quantity})</span>
              </td>
              <td style={{ padding: "10px 0", fontSize: "14px", color: "#f4f4f5", fontWeight: "bold", textAlign: "right" }}>
                {(item.price * item.quantity).toFixed(2)} kr
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Hr className="border-zinc-800 my-6" />

      {/* HTML Table for Totals (Gmail friendly) */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ padding: "4px 0", fontSize: "12px", color: "#a1a1aa", textAlign: "left" }}>
              Order ID
            </td>
            <td style={{ padding: "4px 0", fontSize: "12px", color: "#d4d4d8", fontFamily: "monospace", textAlign: "right" }}>
              {orderId}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#f4f4f5", textAlign: "left" }}>
              Total Paid
            </td>
            <td style={{ padding: "10px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#ef4444", textAlign: "right" }}>
              {totalAmount.toFixed(2)} kr
            </td>
          </tr>
        </tbody>
      </table>

      <Hr className="border-zinc-800 my-6" />

      <Text className="text-xs text-zinc-500 text-center">
        Hope you enjoy your movies! If you have any questions, feel free to contact our support team. 🎬
      </Text>
    </EmailLayout>
  );
}

// Mock data for the React Email Preview Dashboard
OrderConfirmation.PreviewProps = {
  customerName: "Jane Doe",
  orderId: "order_mock789",
  items: [
    { title: "Inception", quantity: 1, price: 99.00 },
    { title: "Interstellar", quantity: 2, price: 149.00 }
  ],
  totalAmount: 397.00
} satisfies Props;
