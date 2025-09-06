'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { registerForEventAction, unregisterFromEventAction } from '@/app/events/actions';
import { toast } from 'sonner';

interface EventRegistrationButtonProps {
  eventId: string;
  userRegistrationStatus: 'registered' | 'waitlisted' | null;
  eventStatus: 'open' | 'full' | 'closed';
  registrationCount: number;
  maxCapacity: number;
  registrationDeadline?: string;
  isAuthenticated: boolean;
  userCanRegister: boolean;
}

export default function EventRegistrationButton({
  eventId,
  userRegistrationStatus,
  eventStatus,
  registrationCount,
  maxCapacity,
  registrationDeadline,
  isAuthenticated,
  userCanRegister
}: EventRegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  -    // Debug: ensure component renders something
    console.log('EventRegistrationButton rendering with:', {
      eventId,
      userRegistrationStatus,
      eventStatus,
      isAuthenticated,
      userCanRegister
    });


  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for this event');
      return
    }

    if (!userCanRegister) {
      toast.error('You do not have permission to register for this event');
      return
    }

    setIsLoading(true);
    const result = await registerForEventAction(eventId);
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error)
    }
  }
  const handleUnregister = async () => {
    setIsLoading(true);
    const result = await unregisterFromEventAction(eventId);
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  }
  // Registration deadline info
  const deadlineInfo = registrationDeadline ? (
    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
      <Clock className="w-4 h-4" />
      <span>
        Registration closes: {new Date(registrationDeadline).toLocaleDateString()}
      </span>
    </div>
  ) : null;

  // Capacity info
  const capacityInfo = maxCapacity > 0 ? (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Users className="w-4 h-4" />
      <span>
        {registrationCount} / {maxCapacity} registered
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Users className="w-4 h-4" />
      <span>{registrationCount} registered</span>
    </div>
  );
  // If user is registered
  if (userRegistrationStatus === 'registered') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">Registered</span>
        </div>
        {capacityInfo}
        <Button
          onClick={handleUnregister}
          disabled={isLoading || eventStatus === 'closed'}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unregistering...
            </>
          ) : (
            'Unregister'
          )}
        </Button>
        {deadlineInfo}
      </div>
    );
  }

  // If user is waitlisted
  if (userRegistrationStatus === 'waitlisted') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-yellow-600">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Waitlisted</span>
        </div>
        {capacityInfo}
        <Button
          onClick={handleUnregister}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Removing...
            </>
          ) : (
            'Remove from Waitlist'
          )}
        </Button>
        {deadlineInfo}
      </div>
    );
  }

  // If registration is closed
  if (eventStatus === 'closed') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span className="font-medium">Registration Closed</span>
        </div>
        {capacityInfo}
        {deadlineInfo}
      </div>
    );
  }

  // If event is full
  if (eventStatus === 'full') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-yellow-600">
          <Users className="w-4 h-4" />
          <span className="font-medium">Event Full</span>
        </div>
        {capacityInfo}
        <Button
          onClick={handleRegister}
          disabled={isLoading || !isAuthenticated || !userCanRegister}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining Waitlist...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
        {deadlineInfo}
      </div>
    );
  }

  // Registration is open
  return (
    <div className="space-y-2">
      {capacityInfo}
      <Button
        onClick={handleRegister}
        disabled={isLoading || !isAuthenticated || !userCanRegister}
        size="sm"
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
          </>
        ) : (
          'Register'
        )}
      </Button>
      {deadlineInfo}
    </div>
  );
}