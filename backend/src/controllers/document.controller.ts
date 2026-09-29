import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { DocumentService } from '../services/document.service';

export class DocumentController {
  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { title, content, promptVersion, provider } = req.body;
      const sanitizedContent = req.body.sanitizedContent || content;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Document content is required.' });
      }

      const document = await DocumentService.createDocument(
        user.id,
        title || 'Untitled Document',
        content,
        sanitizedContent,
        promptVersion,
        provider
      );

      return res.status(201).json({
        document,
        guardrailSummary: (req as any).guardrailResult,
      });
    } catch (err: any) {
      console.error('[DOCUMENT_CONTROLLER] Error creating document:', err);
      return res.status(500).json({ error: err.message || 'Failed to create and index document' });
    }
  }

  public static list(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const documents = DocumentService.getDocuments(user.id);
      return res.json({ documents });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve documents' });
    }
  }

  public static getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const document = DocumentService.getDocumentById(id, user.id);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.json({ document });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve document' });
    }
  }

  public static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const deleted = DocumentService.deleteDocument(id, user.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Document not found or unauthorized' });
      }

      return res.json({ success: true, message: 'Document and its vector index deleted.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete document' });
    }
  }

  public static async reextract(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { promptVersion, provider } = req.body;

      const document = await DocumentService.reextractInsights(id, user.id, promptVersion, provider);
      return res.json({ document });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to re-extract insights' });
    }
  }
}
