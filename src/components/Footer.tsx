import { Link } from "react-router-dom";

const columns = [
  { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Dashboard", href: "/dashboard" }] },
  { title: "Company", links: [{ label: "About", href: "#about" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Cookies", href: "#" }] },
  { title: "Support", links: [{ label: "Help Center", href: "#" }, { label: "Contact", href: "#" }, { label: "Status", href: "#" }] },
];

const Footer = () => (
  <footer id="about" className="border-t border-border/30 py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <span className="text-xl font-bold gradient-text">ToolzBazzar</span>
          <p className="text-sm text-muted-foreground mt-3">AI-powered video generation for the modern creator.</p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h4 className="font-semibold text-sm mb-4">{c.title}</h4>
            <ul className="space-y-2">
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
      <div className="border-t border-border/30 mt-12 pt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ToolzBazzar. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
