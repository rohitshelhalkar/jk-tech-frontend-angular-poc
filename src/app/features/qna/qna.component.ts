import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';

import { QnaService } from '../../core/services/qna.service';
import { Conversation, Message, SendMessageRequest } from '../../core/models/qna.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-qna',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    TextFieldModule
  ],
  templateUrl: './qna.component.html',
  styleUrls: ['./qna.component.scss']
})
export class QnaComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  
  isLoadingConversations = false;
  isLoadingMessages = false;
  isSendingMessage = false;
  
  searchTerm = '';
  messageText = '';
  
  private shouldScrollToBottom = false;

  constructor(
    private qnaService: QnaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadConversations(): void {
    this.isLoadingConversations = true;
    
    this.qnaService.getConversations({
      limit: 50,
      search: this.searchTerm || undefined
    }).subscribe({
      next: (response) => {
        this.conversations = response.conversations;
        this.isLoadingConversations = false;
        
        // Auto-select first conversation if none selected
        if (!this.selectedConversation && this.conversations.length > 0) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (error) => {
        console.error('Failed to load conversations:', error);
        this.isLoadingConversations = false;
        this.showErrorMessage('Failed to load conversations');
      }
    });
  }

  onSearchChange(): void {
    this.loadConversations();
  }

  createNewConversation(): void {
    this.qnaService.createConversation({}).subscribe({
      next: (conversation) => {
        this.conversations.unshift(conversation);
        this.selectConversation(conversation);
        this.showSuccessMessage('New conversation created');
      },
      error: (error) => {
        console.error('Failed to create conversation:', error);
        this.showErrorMessage('Failed to create conversation');
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    if (this.selectedConversation?.id === conversation.id) {
      return;
    }

    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
  }

  loadMessages(conversationId: string): void {
    this.isLoadingMessages = true;
    
    this.qnaService.getConversation(conversationId).subscribe({
      next: (conversation) => {
        this.messages = conversation.messages || [];
        this.isLoadingMessages = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
        this.isLoadingMessages = false;
        this.showErrorMessage('Failed to load messages');
      }
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedConversation || this.isSendingMessage) {
      return;
    }

    const messageRequest: SendMessageRequest = {
      content: this.messageText.trim(),
      conversationId: this.selectedConversation.id,
      documentIds: [] // Could be enhanced to include specific documents
    };

    this.isSendingMessage = true;
    const originalMessage = this.messageText;
    this.messageText = '';

    this.qnaService.sendMessage(messageRequest).subscribe({
      next: (response) => {
        // Add both user and assistant messages
        this.messages.push(response.userMessage);
        this.messages.push(response.assistantMessage);
        
        this.isSendingMessage = false;
        this.shouldScrollToBottom = true;
        
        // Update conversation in the list (move to top and update timestamp)
        const conversationIndex = this.conversations.findIndex(c => c.id === this.selectedConversation!.id);
        if (conversationIndex !== -1) {
          const updatedConversation = { ...this.conversations[conversationIndex] };
          updatedConversation.updatedAt = new Date().toISOString();
          
          // Auto-generate title from first message if no title exists
          if (!updatedConversation.title && this.messages.length <= 2) {
            updatedConversation.title = this.generateConversationTitle(originalMessage);
            this.updateConversationTitle(updatedConversation.id, updatedConversation.title);
          }
          
          // Move to top of list
          this.conversations.splice(conversationIndex, 1);
          this.conversations.unshift(updatedConversation);
          this.selectedConversation = updatedConversation;
        }
      },
      error: (error) => {
        console.error('Failed to send message:', error);
        this.messageText = originalMessage; // Restore the message
        this.isSendingMessage = false;
        this.showErrorMessage('Failed to send message');
      }
    });
  }

  deleteConversation(conversation: Conversation, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Conversation',
        message: `Are you sure you want to delete this conversation? This action cannot be undone.`,
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.qnaService.deleteConversation(conversation.id).subscribe({
          next: () => {
            this.conversations = this.conversations.filter(c => c.id !== conversation.id);
            
            if (this.selectedConversation?.id === conversation.id) {
              this.selectedConversation = null;
              this.messages = [];
              
              // Select first available conversation
              if (this.conversations.length > 0) {
                this.selectConversation(this.conversations[0]);
              }
            }
            
            this.showSuccessMessage('Conversation deleted successfully');
          },
          error: (error) => {
            console.error('Failed to delete conversation:', error);
            this.showErrorMessage('Failed to delete conversation');
          }
        });
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getConversationTitle(conversation: Conversation): string {
    if (conversation.title) {
      return conversation.title;
    }
    
    if (conversation.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(m => m.role === 'user');
      return firstUserMessage?.content.substring(0, 50) + '...' || 'New Conversation';
    }
    
    return 'New Conversation';
  }

  getConversationPreview(conversation: Conversation): string {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      return lastMessage.content.substring(0, 80) + '...';
    }
    return 'Start a new conversation';
  }

  getMessageSources(message: Message): any[] {
    return message.metadata?.sources || [];
  }

  hasMessageSources(message: Message): boolean {
    return !!(message.metadata?.sources && message.metadata.sources.length > 0);
  }

  private updateConversationTitle(conversationId: string, title: string): void {
    this.qnaService.updateConversationTitle(conversationId, title).subscribe({
      error: (error) => {
        console.error('Failed to update conversation title:', error);
      }
    });
  }

  private generateConversationTitle(firstMessage: string): string {
    // Generate a title from the first message
    const words = firstMessage.trim().split(' ');
    const title = words.slice(0, 6).join(' ');
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  trackByConversationId(index: number, conversation: Conversation): string {
    return conversation.id;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}