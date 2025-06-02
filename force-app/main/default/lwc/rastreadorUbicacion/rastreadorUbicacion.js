import { LightningElement, track } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

export default class UbicacionRastreadorGerente extends LightningElement {
    subscription = {};
    channelName = '/event/Ubicacion_Event__e';

    @track mapMarkers = [];
    @track center = { latitude: 0, longitude: 0 };

    usuariosMapa = new Map();

    connectedCallback() {
        onError(error => {
            console.error('EMP API error', error);
        });

        this.handleSubscribe();
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            const payload = response.data.payload;
            const lat = parseFloat(payload.Lat__c);
            const lon = parseFloat(payload.Lon__c);
            const usuarioId = payload.UsuarioId__c;
            const fecha = payload.Fecha__c;

            // Aquí extraemos el nombre que envía el evento, si existe
            const usuarioNombre = payload.UsuarioNombre__c || payload.VendedorNombre__c || usuarioId;

            // Pasamos el nombre a actualizarMarcadores
            this.actualizarMarcadores(usuarioId, usuarioNombre, lat, lon, fecha);
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            this.subscription = response;
            console.log('Suscrito a ' + this.channelName);
        });
    }

    actualizarMarcadores(usuarioId, usuarioNombre, lat, lon, fecha) {
        this.usuariosMapa.set(usuarioId, {
            location: {
                Latitude: lat,
                Longitude: lon
            },
            title: `Vendedor: ${usuarioNombre}`, // Usamos el nombre aquí
            description: `Última actualización: ${new Date(fecha).toLocaleString()}`
        });

        this.mapMarkers = Array.from(this.usuariosMapa.values()).filter(marker => marker && marker.location);

        // Calcular centro promedio
        const total = this.mapMarkers.length;
        if (total > 0) {
            const avgLat = this.mapMarkers.reduce((sum, m) => sum + m.location.Latitude, 0) / total;
            const avgLon = this.mapMarkers.reduce((sum, m) => sum + m.location.Longitude, 0) / total;

            this.center = { latitude: avgLat, longitude: avgLon };
        }
    }

    handleUnsubscribe() {
        unsubscribe(this.subscription, response => {
            console.log('Desuscrito de ' + this.channelName);
        });
    }

}
