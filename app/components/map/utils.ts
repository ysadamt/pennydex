export const getStatusColor = (status: string): string => {
  if (status === "available") return "#22c55e";
  if (status === "outoforder") return "#f59e0b";
  return "#ef4444";
};

export const getStatusLabel = (status: string): string => {
  if (status === "available") return "Available";
  if (status === "outoforder") return "Out of Order";
  return "Gone";
};

export const getStatusBadgeColor = (status: string): string => {
  if (status === "available") return "green";
  if (status === "outoforder") return "yellow";
  return "red";
};

export const formatSyncDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
};
