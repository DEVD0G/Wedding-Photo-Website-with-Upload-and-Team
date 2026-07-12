#!/usr/bin/env bash
# ============================================================
#  Petersen Memories – Rebuild-Skript
# ------------------------------------------------------------
#  Holt die neuesten Änderungen, aktualisiert Abhängigkeiten &
#  Datenbank, erstellt einen frischen Produktions-Build und
#  startet den Dienst neu.
#
#  Aufruf:
#     ./rebuild.sh                   (Standard: Pull + Build + Neustart)
#     ./rebuild.sh --no-pull         (lokalen Stand bauen, kein git pull)
#     ./rebuild.sh --no-restart      (nicht automatisch neu starten)
#     ./rebuild.sh --allow-data-loss (destruktive Schema-Aenderungen
#                                     zulassen, z.B. einmalig noetig,
#                                     wenn ein Bereich wie das Gaestebuch
#                                     samt Tabelle entfernt wurde;
#                                     vorher wird die DB gesichert)
# ============================================================

set -euo pipefail

SERVICE_NAME="petersen-memories"

# ---- Farben / Ausgabe --------------------------------------
C_INFO="\033[1;34m"; C_OK="\033[1;32m"; C_WARN="\033[1;33m"; C_ERR="\033[1;31m"; C_RST="\033[0m"
info()  { echo -e "${C_INFO}==>${C_RST} $*"; }
ok()    { echo -e "${C_OK}  ✔${C_RST} $*"; }
warn()  { echo -e "${C_WARN}  !${C_RST} $*"; }
die()   { echo -e "${C_ERR}  x${C_RST} $*" >&2; exit 1; }

# ---- Parameter ---------------------------------------------
DO_PULL="yes"
DO_RESTART="yes"
ALLOW_DATA_LOSS="no"
for arg in "$@"; do
  case "$arg" in
    --no-pull)         DO_PULL="no" ;;
    --no-restart)      DO_RESTART="no" ;;
    --allow-data-loss) ALLOW_DATA_LOSS="yes" ;;
    *) die "Unbekannte Option: $arg" ;;
  esac
done

# ---- Vorbedingungen ----------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
[ -f package.json ] || die "package.json nicht gefunden – Skript im Projektordner ausführen."

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

echo
info "Petersen Memories – Rebuild wird gestartet"
echo

# ---- 1. Neueste Änderungen holen ---------------------------
if [ "$DO_PULL" = "yes" ] && [ -d .git ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  info "Hole neueste Änderungen von origin/${BRANCH} …"

  PULLED="no"
  DELAY=2
  for attempt in 1 2 3 4; do
    if git pull origin "$BRANCH"; then
      PULLED="yes"
      break
    fi
    warn "git pull fehlgeschlagen (Versuch ${attempt}) – neuer Versuch in ${DELAY}s …"
    sleep "$DELAY"
    DELAY=$((DELAY * 2))
  done

  if [ "$PULLED" = "yes" ]; then
    ok "Code aktualisiert ($(git rev-parse --short HEAD))"
  else
    warn "Konnte nicht aktualisieren – es wird der lokale Stand gebaut."
  fi
else
  warn "git pull übersprungen – es wird der lokale Stand gebaut."
fi

# ---- 2. Abhängigkeiten ------------------------------------
info "Abhängigkeiten werden aktualisiert …"
npm install --no-audit --no-fund
ok "Abhängigkeiten aktuell"

# ---- 3. Datenbank-Schema abgleichen -----------------------
info "Datenbank-Schema wird abgeglichen (Prisma) …"
if [ "$ALLOW_DATA_LOSS" = "yes" ]; then
  # Sicherung anlegen, bevor destruktive Aenderungen zugelassen werden.
  DB_FILE="prisma/dev.db"
  if [ -f "$DB_FILE" ]; then
    BACKUP="${DB_FILE}.$(date +%Y%m%d-%H%M%S).bak"
    cp "$DB_FILE" "$BACKUP"
    ok "Datenbank gesichert: $BACKUP"
  fi
  npx prisma db push --accept-data-loss
else
  # Standard: bricht bei destruktiven Aenderungen bewusst ab.
  # Dann ggf. einmalig mit ./rebuild.sh --allow-data-loss ausfuehren.
  npx prisma db push
fi
ok "Datenbank ist aktuell"

# ---- 4. Produktions-Build ---------------------------------
info "Produktions-Build wird erstellt …"
npm run build
ok "Build erfolgreich"

# ---- 5. Dienst neu starten --------------------------------
if [ "$DO_RESTART" = "yes" ]; then
  if [ -f "/etc/systemd/system/${SERVICE_NAME}.service" ]; then
    info "Dienst „${SERVICE_NAME}“ wird neu gestartet …"
    $SUDO systemctl restart "${SERVICE_NAME}"
    sleep 2
    if $SUDO systemctl is-active --quiet "${SERVICE_NAME}"; then
      ok "Dienst läuft wieder"
    else
      die "Dienst startet nicht – Logs prüfen: sudo journalctl -u ${SERVICE_NAME} -n 50"
    fi
  else
    warn "Kein systemd-Dienst gefunden – bitte manuell starten: npm run start"
  fi
else
  warn "Neustart übersprungen (--no-restart)."
fi

# ---- Abschluss --------------------------------------------
echo
ok "Rebuild abgeschlossen!"
echo
