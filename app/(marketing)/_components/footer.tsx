import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Youtube, Linkedin, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full p-6 bg-background z-50 dark:bg-[#1F1F1F]">
      <Logo />
      <div className="flex items-center gap-x-4 sm:ml-10">
        <a
          href="https://www.linkedin.com/in/mainak-das-93b787287/"
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="w-6 h-6 text-muted-foreground hover:text-blue-700 transition" />
        </a>
        <a
          href="https://github.com/mainak569"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="w-6 h-6 text-muted-foreground hover:text-black dark:hover:text-white transition" />
        </a>
        <a
          href="https://x.com/mainak__13"
          aria-label="X (Twitter)"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="w-6 h-6 text-muted-foreground hover:text-blue-400 transition" />
        </a>
        <a
          href="https://youtube.com"
          aria-label="YouTube"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Youtube className="w-6 h-6 text-muted-foreground hover:text-red-600 transition" />
        </a>
      </div>
      <div className="sm:ml-auto flex flex-wrap items-center justify-center gap-x-2 text-muted-foreground">
        <Button variant="ghost" size="sm">
          Privacy Policy
        </Button>
        <Button variant="ghost" size="sm">
          Terms & Conditions
        </Button>
      </div>
    </div>
  );
};

export default Footer;
