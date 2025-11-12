#!/bin/bash
# Script de vérification pour le déploiement Kubernetes + Argo CD
# Usage: ./check-deployment.sh

set -e

echo "🔍 Vérification du déploiement Kubernetes + Argo CD"
echo "=================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de vérification
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        exit 1
    fi
}

# 1. Vérifier kubectl
echo "1. Vérification de kubectl..."
kubectl version --client > /dev/null 2>&1
check "kubectl est installé"

kubectl cluster-info > /dev/null 2>&1
check "kubectl est connecté au cluster"

# 2. Vérifier Argo CD
echo ""
echo "2. Vérification d'Argo CD..."
kubectl get namespace argocd > /dev/null 2>&1
check "Namespace argocd existe"

kubectl -n argocd get pods | grep -q "Running"
check "Pods Argo CD sont en cours d'exécution"

# 3. Vérifier l'Application Argo CD
echo ""
echo "3. Vérification de l'Application reservation..."
kubectl -n argocd get application reservation > /dev/null 2>&1
check "Application 'reservation' existe dans Argo CD"

STATUS=$(kubectl -n argocd get application reservation -o jsonpath='{.status.sync.status}')
if [ "$STATUS" == "Synced" ]; then
    echo -e "${GREEN}✓${NC} Application est synchronisée (status: $STATUS)"
else
    echo -e "${YELLOW}⚠${NC} Application n'est pas synchronisée (status: $STATUS)"
fi

HEALTH=$(kubectl -n argocd get application reservation -o jsonpath='{.status.health.status}')
if [ "$HEALTH" == "Healthy" ]; then
    echo -e "${GREEN}✓${NC} Application est saine (health: $HEALTH)"
else
    echo -e "${YELLOW}⚠${NC} Application n'est pas saine (health: $HEALTH)"
fi

# 4. Vérifier le namespace de l'application
echo ""
echo "4. Vérification du namespace reservation-salles..."
kubectl get namespace reservation-salles > /dev/null 2>&1
check "Namespace reservation-salles existe"

# 5. Vérifier les ressources déployées
echo ""
echo "5. Vérification des ressources déployées..."

kubectl -n reservation-salles get deployment laravel-app > /dev/null 2>&1
check "Deployment laravel-app existe"

kubectl -n reservation-salles get service laravel-service > /dev/null 2>&1
check "Service laravel-service existe"

kubectl -n reservation-salles get configmap laravel-config > /dev/null 2>&1
check "ConfigMap laravel-config existe"

kubectl -n reservation-salles get configmap nginx-config > /dev/null 2>&1
check "ConfigMap nginx-config existe"

kubectl -n reservation-salles get secret app-secrets > /dev/null 2>&1
check "Secret app-secrets existe"

# 6. Vérifier l'état des pods
echo ""
echo "6. État des pods..."
READY_PODS=$(kubectl -n reservation-salles get pods -l app=laravel -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
TOTAL_PODS=$(kubectl -n reservation-salles get pods -l app=laravel --no-headers | wc -l)

echo "Pods prêts: $READY_PODS/$TOTAL_PODS"
if [ "$READY_PODS" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Au moins un pod est prêt"
else
    echo -e "${RED}✗${NC} Aucun pod n'est prêt"
fi

# 7. Afficher les ressources
echo ""
echo "=================================================="
echo "📊 Résumé des ressources"
echo "=================================================="
echo ""
echo "Pods:"
kubectl -n reservation-salles get pods -l app=laravel
echo ""
echo "Services:"
kubectl -n reservation-salles get svc
echo ""
echo "Ingress:"
kubectl -n reservation-salles get ingress 2>/dev/null || echo "Aucun Ingress trouvé"
echo ""

# 8. URL d'accès
echo "=================================================="
echo "🌐 Accès à l'application"
echo "=================================================="
echo ""

INGRESS_HOST=$(kubectl -n reservation-salles get ingress reservation-ingress -o jsonpath='{.spec.rules[0].host}' 2>/dev/null)
if [ ! -z "$INGRESS_HOST" ]; then
    echo "URL: https://$INGRESS_HOST"
else
    echo "Pas d'Ingress configuré. Utiliser port-forward:"
    echo "  kubectl -n reservation-salles port-forward svc/laravel-service 8080:80"
    echo "  Puis ouvrir http://localhost:8080"
fi

echo ""
echo "Argo CD UI:"
echo "  kubectl -n argocd port-forward svc/argocd-server 8080:443"
echo "  Puis ouvrir https://localhost:8080"
echo ""

echo "=================================================="
echo -e "${GREEN}✓ Vérification terminée${NC}"
echo "=================================================="
