import React from "react";

export default class TrendErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("IncidentTrendChart crashed:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-center text-sm text-red-400 mt-2">
                    Incident trend temporarily unavailable.
                </div>
            );
        }
        return this.props.children;
    }
}
