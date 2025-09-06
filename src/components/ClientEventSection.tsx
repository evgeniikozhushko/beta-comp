'use client'

import React from 'react';
import CreateEventSheet from '@/components/CreateEventSheet';
import EventRegistrationButton from '@/components/EventRegistrationButton';

interface ClientEventSectionProps {
  // CreateEventSheet props
  facilities: Array<{ id: string; name: string }>;
  showCreateEvent: boolean;
  
  // EventRegistrationButton props - array of event registration data
  eventRegistrations: Array<{
    eventId: string;
    userRegistrationStatus: 'registered' | 'waitlisted' | null;
    eventStatus: 'open' | 'full' | 'closed';
    registrationCount: number;
    maxCapacity: number;
    registrationDeadline?: string;
    isAuthenticated: boolean;
    userCanRegister: boolean;
  }>;
}

export function ClientCreateEventSection({ facilities, showCreateEvent }: Pick<ClientEventSectionProps, 'facilities' | 'showCreateEvent'>) {
  if (!showCreateEvent) return null;
  
  return (
    <div className="mb-6">
      <CreateEventSheet facilities={facilities} />
    </div>
  );
}

export function ClientEventRegistrationButton(props: ClientEventSectionProps['eventRegistrations'][0]) {
  return (
    <EventRegistrationButton
      eventId={props.eventId}
      userRegistrationStatus={props.userRegistrationStatus}
      eventStatus={props.eventStatus}
      registrationCount={props.registrationCount}
      maxCapacity={props.maxCapacity}
      registrationDeadline={props.registrationDeadline}
      isAuthenticated={props.isAuthenticated}
      userCanRegister={props.userCanRegister}
    />
  );
}