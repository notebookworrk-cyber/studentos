// Permission model (Prompt 2 §31 + AI CORE §permissions).
// Levels: read (free) < suggest < write < execute < system (always confirm).
// TODO: wire into AI tool layer so every privileged action is gated here.
export class PermissionManager {
  constructor() {
    this.grants = new Map(); // key -> level
  }

  require(key, level) {
    const granted = this.grants.get(key) || "read";
    const order = ["read", "suggest", "write", "execute", "system"];
    return order.indexOf(granted) >= order.indexOf(level);
  }

  grant(key, level) {
    this.grants.set(key, level);
  }

  revoke(key) {
    this.grants.delete(key);
  }
}