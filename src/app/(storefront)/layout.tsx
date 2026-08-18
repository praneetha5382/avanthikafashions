import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Marquee from "@/components/Marquee";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Marquee />
      <Navbar />
      <CartDrawer />
      <main className="main-content">{children}</main>
      <Footer />
    </>
  );
}
