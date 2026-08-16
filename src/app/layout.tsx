import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Avanthika | The Signature Saree Collection",
  description: "Experience the epitome of South Indian royal heritage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="fade-in">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
