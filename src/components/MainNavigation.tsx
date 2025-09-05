"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigationItems = [
  {
    href: "/",
    label: "Home"
  },
  {
    href: "/events", 
    label: "Events"
  },
  {
    href: "/about",
    label: "About"
  },
];

export function MainNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <NavigationMenu viewport={false} className="hidden md:flex">
        <NavigationMenuList>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink 
                  asChild 
                  className={navigationMenuTriggerStyle()}
                >
                  <Link 
                    href={item.href} 
                    className={`flex items-center gap-2 ${
                      isActive 
                        ? 'bg-accent text-accent-foreground font-medium' 
                        : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Navigation - Hidden on desktop */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button 
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none transition-colors"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-6">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none ${
                    isActive 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-foreground'
                  }`}
                >
                  {/* <item.icon className="h-5 w-5" /> */}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
