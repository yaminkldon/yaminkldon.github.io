// Assignment Submission System
// Handles file uploads and assignment submissions for students

class AssignmentSubmissionSystem {
  constructor() {
    this.storage = firebase.storage();
    this.db = firebase.database();
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
  }

  // Initialize assignment submission interface
  initializeSubmissionInterface(assignmentId, containerId) {
    this.db.ref(`assignments/${assignmentId}`).once('value').then(snapshot => {
      if (snapshot.exists()) {
        const assignment = snapshot.val();
        this.createSubmissionInterface(assignmentId, assignment, containerId);
      }
    });
  }

  createSubmissionInterface(assignmentId, assignment, containerId) {
    const container = document.getElementById(containerId);
    
    const interfaceHtml = `
      <div class="assignment-submission-container">
        <div class="assignment-header">
          <h3>${assignment.title}</h3>
          <p class="assignment-description">${assignment.description}</p>
          <div class="assignment-meta">
            <span class="due-date">Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
            <span class="max-points">Max Points: ${assignment.maxPoints}</span>
          </div>
        </div>
        
        <div class="submission-interface">
          ${assignment.submissionType === 'file' || assignment.submissionType === 'both' ? 
            this.createFileUploadInterface(assignment.allowedFileTypes) : ''
          }
          
          ${assignment.submissionType === 'text' || assignment.submissionType === 'both' ? 
            this.createTextSubmissionInterface() : ''
          }
          
          <div class="submission-actions">
            <button class="action-btn" onclick="submitAssignment('${assignmentId}')">Submit Assignment</button>
            <button class="action-btn secondary" onclick="saveDraft('${assignmentId}')">Save Draft</button>
          </div>
        </div>
        
        <div class="submission-status" id="submissionStatus">
          <!-- Status will be displayed here -->
        </div>
      </div>
    `;
    
    container.innerHTML = interfaceHtml;
    
    // Initialize drag and drop for file uploads
    this.initializeDragAndDrop();
    
    // Load existing submission if any
    this.loadExistingSubmission(assignmentId);
  }

  createFileUploadInterface(allowedTypes) {
    return `
      <div class="file-upload-section">
        <h4>File Upload</h4>
        <div class="file-upload" id="fileUploadArea">
          <div class="upload-icon">
            <span class="material-icons" style="font-size: 48px; color: #6c4fc1;">cloud_upload</span>
          </div>
          <p>Drag and drop your file here or click to browse</p>
          <p class="file-types">Allowed types: ${allowedTypes.join(', ')}</p>
          <input type="file" id="fileInput" accept="${allowedTypes.join(',')}" style="display: none;">
          <div class="progress-bar" id="uploadProgress" style="display: none;">
            <div class="progress-fill" id="progressFill"></div>
          </div>
        </div>
        <div class="uploaded-files" id="uploadedFiles">
          <!-- Uploaded files will be displayed here -->
        </div>
      </div>
    `;
  }

  createTextSubmissionInterface() {
    return `
      <div class="text-submission-section">
        <h4>Text Submission</h4>
        <textarea class="form-textarea" id="textSubmission" placeholder="Enter your submission text here..." rows="10"></textarea>
        <div class="text-formatting-tools">
          <small>Use basic formatting: **bold**, *italic*, [link](url)</small>
        </div>
      </div>
    `;
  }

  initializeDragAndDrop() {
    const uploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', () => fileInput.click());
      
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        this.handleFileSelection(files);
      });
      
      fileInput.addEventListener('change', (e) => {
        this.handleFileSelection(e.target.files);
      });
    }
  }

  handleFileSelection(files) {
    Array.from(files).forEach(file => {
      if (this.validateFile(file)) {
        this.uploadFile(file);
      }
    });
  }

  validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      alert(`File ${file.name} is too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
      return false;
    }
    
    // Check file type
    const allowedTypes = this.getCurrentAllowedTypes();
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`File type ${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    return true;
  }

  getCurrentAllowedTypes() {
    // Get allowed types from the current assignment
    const fileTypesElement = document.querySelector('.file-types');
    if (fileTypesElement) {
      return fileTypesElement.textContent.replace('Allowed types: ', '').split(', ');
    }
    return ['.pdf', '.doc', '.docx', '.txt'];
  }

  uploadFile(file) {
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const uploadedFiles = document.getElementById('uploadedFiles');
    
    progressBar.style.display = 'block';
    
    const storageRef = this.storage.ref(`assignments/${firebase.auth().currentUser.uid}/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressFill.style.width = progress + '%';
      },
      (error) => {
        console.error('Upload error:', error);
        alert('Error uploading file. Please try again.');
        progressBar.style.display = 'none';
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          progressBar.style.display = 'none';
          this.addUploadedFileToInterface(file.name, downloadURL);
        });
      }
    );
  }

  addUploadedFileToInterface(fileName, downloadURL) {
    const uploadedFiles = document.getElementById('uploadedFiles');
    
    const fileHtml = `
      <div class="uploaded-file-item" data-url="${downloadURL}">
        <span class="material-icons">attach_file</span>
        <span class="file-name">${fileName}</span>
        <button class="action-btn secondary" onclick="removeUploadedFile(this)">Remove</button>
      </div>
    `;
    
    uploadedFiles.insertAdjacentHTML('beforeend', fileHtml);
  }

  removeUploadedFile(button) {
    const fileItem = button.closest('.uploaded-file-item');
    fileItem.remove();
  }

  loadExistingSubmission(assignmentId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;
    
    this.db.ref('submissions').orderByChild('assignmentId').equalTo(assignmentId).once('value').then(snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const submission = child.val();
          if (submission.studentId === currentUser.uid) {
            this.populateExistingSubmission(submission);
          }
        });
      }
    });
  }

  populateExistingSubmission(submission) {
    // Populate text submission if exists
    const textSubmission = document.getElementById('textSubmission');
    if (textSubmission && submission.textContent) {
      textSubmission.value = submission.textContent;
    }
    
    // Populate file uploads if exists
    if (submission.fileUrl) {
      this.addUploadedFileToInterface(submission.fileName || 'Uploaded File', submission.fileUrl);
    }
    
    // Show submission status
    const statusContainer = document.getElementById('submissionStatus');
    if (submission.submitted) {
      statusContainer.innerHTML = `
        <div class="submission-submitted">
          <h4>Submission Status: Submitted</h4>
          <p>Submitted on: ${new Date(submission.submittedAt).toLocaleDateString()}</p>
          ${submission.graded ? `<p>Grade: ${submission.grade}/${submission.maxPoints}</p>` : '<p>Pending grading</p>'}
          ${submission.feedback ? `<p>Feedback: ${submission.feedback}</p>` : ''}
        </div>
      `;
    } else {
      statusContainer.innerHTML = `
        <div class="submission-draft">
          <h4>Status: Draft</h4>
          <p>Last saved: ${new Date(submission.lastSaved).toLocaleDateString()}</p>
        </div>
      `;
    }
  }

  async submitAssignment(assignmentId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      alert('Please log in to submit assignment');
      return;
    }
    
    const textContent = document.getElementById('textSubmission')?.value || '';
    const uploadedFiles = document.querySelectorAll('.uploaded-file-item');
    
    if (!textContent && uploadedFiles.length === 0) {
      alert('Please provide either text content or upload a file');
      return;
    }
    
    const submissionData = {
      assignmentId: assignmentId,
      studentId: currentUser.uid,
      studentEmail: currentUser.email,
      textContent: textContent,
      submittedAt: Date.now(),
      submitted: true,
      graded: false
    };
    
    // Add file information if uploaded
    if (uploadedFiles.length > 0) {
      const fileItem = uploadedFiles[0]; // For now, handle single file
      submissionData.fileUrl = fileItem.dataset.url;
      submissionData.fileName = fileItem.querySelector('.file-name').textContent;
    }
    
    // Get assignment details for additional info
    const assignmentSnapshot = await this.db.ref(`assignments/${assignmentId}`).once('value');
    const assignment = assignmentSnapshot.val();
    
    submissionData.assignmentTitle = assignment.title;
    submissionData.maxPoints = assignment.maxPoints;
    submissionData.rubricId = assignment.rubric;
    
    // Get student name
    const userSnapshot = await this.db.ref('users').orderByChild('email').equalTo(currentUser.email).once('value');
    if (userSnapshot.exists()) {
      userSnapshot.forEach(child => {
        submissionData.studentName = child.val().name || currentUser.email;
      });
    }
    
    // Save submission
    try {
      await this.db.ref('submissions').push(submissionData);
      alert('Assignment submitted successfully!');
      this.loadExistingSubmission(assignmentId);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment. Please try again.');
    }
  }

  async saveDraft(assignmentId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;
    
    const textContent = document.getElementById('textSubmission')?.value || '';
    const uploadedFiles = document.querySelectorAll('.uploaded-file-item');
    
    const draftData = {
      assignmentId: assignmentId,
      studentId: currentUser.uid,
      studentEmail: currentUser.email,
      textContent: textContent,
      lastSaved: Date.now(),
      submitted: false
    };
    
    // Add file information if uploaded
    if (uploadedFiles.length > 0) {
      const fileItem = uploadedFiles[0];
      draftData.fileUrl = fileItem.dataset.url;
      draftData.fileName = fileItem.querySelector('.file-name').textContent;
    }
    
    try {
      await this.db.ref('submissions').push(draftData);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    }
  }
}

// Initialize the submission system
const submissionSystem = new AssignmentSubmissionSystem();

// Global functions for onclick events
function submitAssignment(assignmentId) {
  submissionSystem.submitAssignment(assignmentId);
}

function saveDraft(assignmentId) {
  submissionSystem.saveDraft(assignmentId);
}

function removeUploadedFile(button) {
  submissionSystem.removeUploadedFile(button);
}

// Auto-grading system for quizzes
class AutoGradingSystem {
  constructor() {
    this.db = firebase.database();
  }

  // Grade a quiz submission automatically
  gradeQuizSubmission(submissionId, quizId, answers) {
    return new Promise((resolve, reject) => {
      this.db.ref(`quizzes/${quizId}`).once('value').then(quizSnapshot => {
        if (!quizSnapshot.exists()) {
          reject('Quiz not found');
          return;
        }
        
        const quiz = quizSnapshot.val();
        const results = this.calculateQuizScore(quiz, answers);
        
        // Update submission with results
        const updateData = {
          score: results.score,
          totalQuestions: results.totalQuestions,
          correctAnswers: results.correctAnswers,
          autoGraded: true,
          gradedAt: Date.now()
        };
        
        this.db.ref(`quizSubmissions/${submissionId}`).update(updateData).then(() => {
          resolve(results);
        }).catch(reject);
      }).catch(reject);
    });
  }

  calculateQuizScore(quiz, userAnswers) {
    let correctAnswers = 0;
    let totalQuestions = 0;
    const questionResults = [];
    
    quiz.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      let isCorrect = false;
      
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        isCorrect = userAnswer === question.correctAnswer;
        totalQuestions++;
      } else if (question.type === 'fill-blank') {
        const correctText = question.correctAnswer.toLowerCase().trim();
        const userText = (userAnswer || '').toLowerCase().trim();
        isCorrect = userText === correctText;
        totalQuestions++;
      }
      // Short answer questions are not auto-graded
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      questionResults.push({
        questionIndex: index,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        type: question.type
      });
    });
    
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      questionResults: questionResults
    };
  }

  // Generate detailed feedback for quiz results
  generateQuizFeedback(quiz, results) {
    let feedback = `Quiz Results:\n`;
    feedback += `Score: ${results.score}% (${results.correctAnswers}/${results.totalQuestions})\n\n`;
    
    results.questionResults.forEach((result, index) => {
      const question = quiz.questions[index];
      feedback += `Question ${index + 1}: ${result.isCorrect ? '✓' : '✗'}\n`;
      feedback += `${question.text}\n`;
      
      if (question.type === 'multiple-choice') {
        feedback += `Your answer: ${question.options[result.userAnswer] || 'No answer'}\n`;
        feedback += `Correct answer: ${question.options[result.correctAnswer]}\n`;
      } else if (question.type === 'true-false') {
        feedback += `Your answer: ${result.userAnswer === 0 ? 'True' : 'False'}\n`;
        feedback += `Correct answer: ${result.correctAnswer === 0 ? 'True' : 'False'}\n`;
      } else if (question.type === 'fill-blank') {
        feedback += `Your answer: ${result.userAnswer || 'No answer'}\n`;
        feedback += `Correct answer: ${result.correctAnswer}\n`;
      }
      
      feedback += '\n';
    });
    
    return feedback;
  }
}

// Initialize auto-grading system
const autoGradingSystem = new AutoGradingSystem();

// Export for use in other files
if (typeof window !== 'undefined') {
  window.AssignmentSubmissionSystem = AssignmentSubmissionSystem;
  window.AutoGradingSystem = AutoGradingSystem;
  window.submissionSystem = submissionSystem;
  window.autoGradingSystem = autoGradingSystem;
}
