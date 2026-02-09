const ZONE_MULTIPLIER = 2.0;
const PEAK_HOUR_MULTIPLIER = 1.5;
const REGULAR_DISCOUNT = 0.9;

const PEAK_HOURS = [
    { start: 7, end: 9 },   
    { start: 17, end: 19 } 
];

function isPeakHour() {
    const now = new Date();
    const currentHour = now.getHours();
    return PEAK_HOURS.some(period => currentHour >= period.start && currentHour < period.end);
}

export function calculateFare(entryStation, exitStation, userType = 'standard') {
    const zoneDifference = Math.abs(entryStation.zone - exitStation.zone);
    let fare = parseFloat(entryStation.base_fare);
    
    fare += (zoneDifference * ZONE_MULTIPLIER);
    
    if (isPeakHour()) {
        fare *= PEAK_HOUR_MULTIPLIER;
    }
    
    if (userType === 'regular') {
        fare *= REGULAR_DISCOUNT;
    }
    
    return Math.round(fare * 2) / 2;
}
