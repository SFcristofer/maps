public with sharing class UbicacionEventPublisher {
    @AuraEnabled
    public static void enviarEventoUbicacion(Decimal lat, Decimal lon) {
        Ubicacion_Event__e evento = new Ubicacion_Event__e(
            Lat__c = lat,
            Lon__c = lon,
            UsuarioId__c = UserInfo.getUserId(),
            Fecha__c = System.now()
        );
        EventBus.publish(evento);
    }
}
