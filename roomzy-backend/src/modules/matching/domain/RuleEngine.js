export class RuleEngine {
  
  static calculateRoomScore(tenantProfile, listing) {
    let score = 70; // Start at max rule score (70/100)
    let penalties = [];

    // Budget Rule (Max penalty: 30 points)
    if (listing.rent > tenantProfile.budget.max) {
      const delta = listing.rent - tenantProfile.budget.max;
      const penalty = Math.min(Math.floor(delta / 1000) * 2, 30); // Lose 2 points per ₹1000 over budget
      score -= penalty;
      penalties.push(`Listing is ₹${delta} over maximum budget.`);
    }

    // Move-in Date Rule (Max penalty: 20 points)
    // Simplified: Lose 5 points per week of misalignment (Requires moment.js or native date math)
    const availableDate = new Date(listing.availableFrom).getTime();
    const now = Date.now();
    if (availableDate > now + (30 * 24 * 60 * 60 * 1000)) { // Available more than 30 days out
       score -= 10;
       penalties.push("Available date is far in the future.");
    }

    // Floor the score at 0
    score = Math.max(score, 0);

    const reason = penalties.length > 0 
      ? `Base criteria met with reservations: ${penalties.join(' ')}`
      : "Excellent logistical match based on budget and availability.";

    return { score, reason };
  }

  static calculateFlatmateScore(tenantProfile, targetProfile) {
    let score = 0;
    let matches = [];

    // Budget Overlap (Max 30 points)
    const maxMin = Math.max(tenantProfile.budget.min, targetProfile.budget.min);
    const minMax = Math.min(tenantProfile.budget.max, targetProfile.budget.max);
    if (maxMin <= minMax) {
      score += 30;
      matches.push("Highly compatible budget ranges.");
    }

    // Lifestyle Overlap (Max 40 points)
    const tTraits = tenantProfile.lifestyleTraits;
    const targetTraits = targetProfile.lifestyleTraits;

    if (tTraits.cleanliness === targetTraits.cleanliness) {
      score += 15;
      matches.push("Matching cleanliness standards.");
    }
    if (tTraits.schedule === targetTraits.schedule) {
      score += 15;
      matches.push("Synchronized daily schedules.");
    }
    if (tTraits.sociability === targetTraits.sociability) {
      score += 10;
    }

    const reason = matches.length > 0 
      ? `Solid baseline match: ${matches.join(' ')}`
      : "Limited baseline lifestyle overlap.";

    return { score, reason };
  }
}