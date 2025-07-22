export async function GET() {
    try {
        // Sample events data - you can replace this with database calls later
        const events = [
            {
                id: 1,
                title: "Championship Finals",
                date: "2025-07-15",
                location: "Main Arena",
                description: "The ultimate competition final round"
            },
            {
                id: 2,
                title: "Qualifier Round 1",
                date: "2025-07-20",
                location: "Training Center",
                description: "First round of qualifications"
            },
            {
                id: 3,
                title: "Team Training Session",
                date: "2025-07-25",
                location: "Gym A",
                description: "Intensive team training for upcoming events"
            },
            {
                id: 4,
                title: "Championship Finals",
                date: "2025-07-15",
                location: "Main Arena",
                description: "The ultimate competition final round"
            },
            {
                id: 5,
                title: "Qualifier Round 1",
                date: "2025-07-20",
                location: "Training Center",
                description: "First round of qualifications"
            },
            {
                id: 6,
                title: "Team Training Session",
                date: "2025-07-25",
                location: "Gym A",
                description: "Intensive team training for upcoming events"
            }
        ];

        return Response.json({ 
            events,
            total: events.length 
        })
    } catch (error) {
        return Response.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}