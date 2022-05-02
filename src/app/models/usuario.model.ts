export class UsuarioModel {
    public idUsuario: string;
    public nombreCompleto: NombreModel;


    constructor(){
        this.idUsuario = '';
        this.nombreCompleto = {
            primerNombre: '',
            segundoNombre: '',
            primerApellido: '',
            segundoApellido: ''
        }

    }
}

export class NombreModel {
    public primerNombre: string;
    public segundoNombre: string;
    public primerApellido: string;
    public segundoApellido: string;

    constructor(){
        this.primerNombre = '';
        this.segundoNombre = '';
        this.primerApellido = '';
        this.segundoApellido = '';
    }
}