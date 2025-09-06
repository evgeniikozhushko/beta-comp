'use client';

  import { useEffect, useState } from 'react';
  import { getEventRegistrations } from '@/app/events/actions';
  import { Badge } from '@/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

  interface EventRegistrationListProps {
    eventId: string;
  }

  export default function EventRegistrationList({ eventId }: EventRegistrationListProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchRegistrations = async () => {
        const result = await getEventRegistrations(eventId);
        if (result.success) {
          setRegistrations(result.registrations);
        }
        setLoading(false);
      };

      fetchRegistrations();
    }, [eventId]);

    if (loading) {
      return <div>Loading registrations...</div>;
    }

    if (registrations.length === 0) {
      return <div>No registrations yet.</div>;
    }

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Registrations ({registrations.length})</h3>
        <div className="space-y-2">
          {registrations.map((registration) => (
            <div key={registration._id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={registration.userId.picture} />
                  <AvatarFallback>
                    {registration.userId.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{registration.userId.displayName}</div>
                  <div className="text-sm text-muted-foreground">{registration.userId.email}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={registration.status === 'registered' ? 'default' : 'secondary'}>
                  {registration.status}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {new Date(registration.registeredAt).toISOString().split('T')[0]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }