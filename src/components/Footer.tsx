import { Link } from "react-router-dom";

const columns = [
  { title: "Platform", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Dashboard", href: "/dashboard" }] },
  { title: "Account", links: [{ label: "Login", href: "/login" }, { label: "Register", href: "/register" }, { label: "Refer & Earn", href: "/refer" }] },
  { title: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Cookie Policy", href: "#" }] },
];

const Footer = () => (
  <footer id="about" className="border-t border-border py-12 md:py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div className="sm:col-span-2 md:col-span-1">
          <span className="text-lg font-bold text-foreground flex items-center gap-2">
            <img src="/logo.png" alt="ToolsBazzar" className="h-8 w-8 rounded" />
            ToolsBazzar
          </span>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            India's #1 Affordable AI Video Platform
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h4 className="font-medium text-sm mb-4 text-foreground">{c.title}</h4>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-10 md:mt-12 pt-6 md:pt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ToolsBazzar. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
