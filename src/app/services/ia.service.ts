import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6Lx0efHodDdj924yfwDF0pLJY7s69IebmP67WTmeDOFYQ' });

  async obtenerAlternativasMedicamento(medicamento: string): Promise<string> {
    try {
      const prompt = `Actúa como un asistente médico farmacéutico. Para el medicamento "${medicamento}", por favor proporciona una lista corta de opciones genéricas o alternativas comerciales equivalentes. Agrega siempre una nota clara de que se debe consultar con un médico antes de cambiar de medicamento.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return response.text || 'No se pudieron obtener alternativas en este momento.';
    } catch (error: any) {
      console.error('Error detallado al consultar la IA:', error);
      
      // Control específico para cuando el servidor esté saturado (Error 503)
      if (error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand')) {
        return 'El servicio de IA está saturado temporalmente. Por favor, intenta de nuevo en unos segundos.';
      }
      
      return 'Ocurrió un error al consultar las alternativas con la IA.';
    }
  }
}