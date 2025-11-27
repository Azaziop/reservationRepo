{{/* Simple helpers for naming */}}
{{- define "reservation-app.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end -}}

{{- define "reservation-app.fullname" -}}
{{- printf "%s-%s" (default .Release.Name .Values.nameOverride) .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
