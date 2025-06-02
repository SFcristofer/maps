import { LightningElement, track } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import obtenerDireccionDesdeCoordenadas from '@salesforce/apex/UbicacionController.obtenerDireccionDesdeCoordenadas';

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

   async actualizarMarcadores(usuarioId, usuarioNombre, lat, lon, fecha) {
    const marker = {
        location: {
            Latitude: lat,
            Longitude: lon
        },
        title: `Vendedor: ${usuarioNombre}`,
        description: `Última actualización: ${new Date(fecha).toLocaleString()}`
    };

    let direccion = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    try {
        const direccionObtenida = await obtenerDireccionDesdeCoordenadas({ lat, lon });
        if (direccionObtenida) {
            direccion = direccionObtenida;
        }
    } catch (error) {
        console.error('Error al obtener dirección desde Apex:', error);
    }

    this.usuariosMapa.set(usuarioId, {
        nombre: usuarioNombre,
        ubicacion: direccion,
        fecha: new Date(fecha).toLocaleString(),
        marker
    });

    // Actualizar marcadores del mapa
    this.mapMarkers = Array.from(this.usuariosMapa.values()).map(u => u.marker);

    // Actualizar tabla
    this.usuarios = Array.from(this.usuariosMapa.entries()).map(([id, u]) => ({
        id,
        nombre: u.nombre,
        ubicacion: u.ubicacion,
        fecha: u.fecha
    }));

    // Calcular centro del mapa
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
async obtenerNombreUbicacion(lat, lon) {
    try {
        const direccion = await obtenerDireccionDesdeCoordenadas({ lat, lon });
        return direccion;
    } catch (error) {
        console.error('Error al obtener dirección desde Apex:', error);
        return 'Ubicación no disponible';
    }
}

}
