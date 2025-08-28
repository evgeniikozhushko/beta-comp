"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarIcon, HomeIcon, InfoIcon } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function MainNavigation() {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        {/* Home Navigation */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/" className="flex items-center gap-2">
              {/* <HomeIcon className="h-4 w-4" /> */}
              Home
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        {/* Events Navigation */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/events" className="flex items-center gap-2">
              {/* <CalendarIcon className="h-4 w-4" /> */}
              Events
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* About Navigation */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/about" className="flex items-center gap-2">
              {/* <InfoIcon className="h-4 w-4" /> */}
              About
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
