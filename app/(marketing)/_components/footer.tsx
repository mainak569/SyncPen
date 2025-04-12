import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Youtube, Linkedin, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <div className="flex items-center w-full p-6 bg-background z-50 dark:bg-[#1F1F1F]">
      <Logo />
      <div className="hidden md:flex items-center gap-x-4 ml-10">
        <a
          href="https://www.linkedin.com/in/mainak-das-93b787287/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="w-6 h-6 text-muted-foreground hover:text-blue-700 transition" />
        </a>
        <a
          href="https://github.com/mainak569"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="w-6 h-6 text-muted-foreground hover:text-black transition" />
        </a>
        <a
          href="https://x.com/mainak__13"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="w-6 h-6 text-muted-foreground hover:text-blue-400 transition" />
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
          <Youtube className="w-6 h-6 text-muted-foreground hover:text-red-600 transition" />
        </a>
      </div>
      <div className="md:ml-auto w-full justify-between md:justify-end flex items-center gap-x-2 text-muted-foreground">
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
