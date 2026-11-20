export function isProfileReady(profile: {
  esimStatus?: string;
  smdpStatus?: string;
}) {
  return (
    profile.esimStatus === "GOT_RESOURCE" &&
    profile.smdpStatus === "RELEASED"
  );
}

export function isOrderOutcomeUnknown(response: {
  success: boolean;
  errorCode?: string | number | null;
}) {
  return (
    !response.success &&
    ["200010", "900001"].includes(String(response.errorCode))
  );
}
