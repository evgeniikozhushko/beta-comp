import { Calendar, ChevronDown } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface CalendarsProps {
  calendars: Array<{
    name: string;
    items: string[];
  }>
}

export function Calendars({ calendars }: CalendarsProps) {
  return (
    <SidebarMenu>
      {calendars.map((calendar) => (
        <Collapsible key={calendar.name} asChild defaultOpen>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <CollapsibleTrigger>
                <Calendar />
                <span>{calendar.name}</span>
                <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarMenuButton>
            <CollapsibleContent>
              <SidebarMenuSub>
                {calendar.items.map((item) => (
                  <SidebarMenuSubItem key={item}>
                    <SidebarMenuSubButton asChild>
                      <span>{item}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
  )
}