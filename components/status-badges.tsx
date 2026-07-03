import { Badge } from "./ui/badge";



function CompletedBadge({value}: {value: string | number}) {
    return (
        <Badge className="bg-badge-success/80">
            {`${value}`}
        </Badge>
    )
}

function CancelledBadge({value}: {value: string | number}) {
    return (
        <Badge className="bg-destructive/80">
            {`${value}`}
        </Badge>
    )
}

function PaidBadge({value}: {value: string | number}) {
    return (
        <Badge className="bg-badge-paid/80">
            {`${value}`}
        </Badge>
    )
}

function PendingBadge({value}: {value: string | number}) {
    return (
        <Badge className="bg-accent-foreground/60">
            {`${value}`}
        </Badge>
    )
}

export { CompletedBadge, CancelledBadge, PaidBadge, PendingBadge }
