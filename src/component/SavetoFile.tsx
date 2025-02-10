import { documentDir, join } from '@tauri-apps/api/path';
import { exists, mkdir,  writeTextFile } from '@tauri-apps/plugin-fs';


export async function WriteTimeLog(timeData, rate) {
    try {
        const docDir = await documentDir();
        const folderPath = await join(docDir, "Daily Logs");
        
        const folderExists = await exists(folderPath);
        if (!folderExists) {
            await mkdir(folderPath, { recursive: true });
        }

        const fecha = new Date();
        const nombreArchivo = `timesheet_${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}.txt`;
        const filePath = await join(folderPath, nombreArchivo);

        const horaActual = fecha.toLocaleTimeString();

        const tiempoFormateado = `${timeData.hours.toString().padStart(2, '0')}:${timeData.minutes.toString().padStart(2, '0')}:${timeData.seconds.toString().padStart(2, '0')}`;
        
        const horasTotales = timeData.hours + (timeData.minutes / 60) + (timeData.seconds / 3600);
        const ganancias = (rate * horasTotales).toFixed(2);

        const logContent = `[${horaActual}] Sesión finalizada - Duración: ${tiempoFormateado} - Ganancias: $${ganancias}\n`;

        await writeTextFile(filePath, logContent, { append: true });
        console.log('Log registrado exitosamente');
        return filePath;
    } catch (error) {
        console.error("Error al escribir el time log:", error);
        throw error;
    }
}