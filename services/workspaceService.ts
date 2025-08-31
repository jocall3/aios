

import { ensureGapiClient } from './googleApiService.ts';
import { logError } from './telemetryService.ts';
import type { SlideSummary } from '../types.ts';

declare var gapi: any;

// --- Docs Service ---
export const createDocument = async (title: string): Promise<{ documentId: string; webViewLink: string }> => {
    try {
        const isReady = await ensureGapiClient();
        if (!isReady) throw new Error("Google API client not ready.");
        
        await gapi.client.load('https://docs.googleapis.com/$discovery/rest?version=v1');

        const response = await gapi.client.docs.documents.create({ title });
        const doc = response.result;
        return { documentId: doc.documentId, webViewLink: `https://docs.google.com/document/d/${doc.documentId}/edit` };
    } catch (error) {
        logError(error as Error, { service: 'workspaceService', function: 'createDocument' });
        throw error;
    }
};

export const insertText = async (documentId: string, text: string): Promise<void> => {
     try {
        const isReady = await ensureGapiClient();
        if (!isReady) throw new Error("Google API client not ready.");

        await gapi.client.load('https://docs.googleapis.com/$discovery/rest?version=v1');

        await gapi.client.docs.documents.batchUpdate({
            documentId,
            resource: {
                requests: [{
                    insertText: {
                        text: text,
                        location: { index: 1 }
                    }
                }]
            }
        });
    } catch (error) {
        logError(error as Error, { service: 'workspaceService', function: 'insertText' });
        throw error;
    }
};

// --- Drive Service ---

const getDriveClient = async () => {
    const isReady = await ensureGapiClient();
    if (!isReady) throw new Error("Google API client not ready.");
    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    return gapi.client.drive;
};

export const findOrCreateFolder = async (folderName: string): Promise<string> => {
    try {
        const drive = await getDriveClient();
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const response = await drive.files.list({ q: query, fields: 'files(id, name)' });
        
        if (response.result.files && response.result.files.length > 0) {
            return response.result.files[0].id;
        } else {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            const createResponse = await drive.files.create({ resource: fileMetadata, fields: 'id' });
            return createResponse.result.id;
        }
    } catch (error) {
        logError(error as Error, { service: 'workspaceService', function: 'findOrCreateFolder' });
        throw error;
    }
};

export const uploadFile = async (folderId: string, fileName: string, content: string, mimeType: string): Promise<any> => {
    try {
        await getDriveClient(); // Ensures client is loaded
        
        const metadata = {
            name: fileName,
            parents: [folderId],
            mimeType,
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: mimeType }));

        const token = sessionStorage.getItem('google_access_token');
        if (!token) throw new Error("Not authenticated");

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: form
        });
        
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(`Failed to upload file: ${errorBody.error.message}`);
        }

        return await res.json();
    } catch (error) {
        logError(error as Error, { service: 'workspaceService', function: 'uploadFile' });
        throw error;
    }
};

// Stubs for other Workspace services
export const appendRowToSheet = async (sheetId: string, rowData: any[]) => { console.log('appendRowToSheet called', sheetId, rowData); };
export const createTask = async (listId: string, title: string, notes: string) => { console.log('createTask called', listId, title, notes); };
export const createCalendarEvent = async (title: string, description: string, date: string) => { console.log('createCalendarEvent called', title, description, date); };