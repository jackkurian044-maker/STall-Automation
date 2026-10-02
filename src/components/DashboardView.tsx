import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  MapPin, 
  Star, 
  MessageSquare, 
  Send, 
  Plus, 
  Calendar, 
  Tag, 
  Sparkles, 
  History, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Store,
  RefreshCw,
  Edit3
} from 'lucide-react';

interface DashboardViewProps {
  onOpenGbpConnect: () => void;
  onOpenCreateBusiness: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenGbpConnect, 
  onOpenCreateBusiness 
}) => {
  const { 
    currentUser, 
    activeBusiness, 
    reviews, 
    posts, 
    activities, 
    draftAiReply, 
    approveAndPublishReply, 
    publishPost,
    syncLiveReviewsFromGoogle,
    gbpAccessToken,
    isLoading
  } = useAuth();

  const [activeSection, setActiveSection] = useState<'reviews' | 'posts' | 'activity'>('reviews');
  const [draftingReviewId, setDraftingReviewId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState<{ [reviewId: string]: string }>({});
  const [isPublishingReply, setIsPublishingReply] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<{ [reviewId: string]: { type: 'success' | 'error'; text: string } }>({});

  // New post state
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostSummary, setNewPostSummary] = useState('');
  const [newPostCta, setNewPostCta] = useState<'ORDER_ONLINE' | 'LEARN_MORE' | 'CALL_NOW'>('LEARN_MORE');
  const [newPostUrl, setNewPostUrl] = useState('');

  if (!currentUser) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <Store className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Unauthenticated Session</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Please click "Sign In with Google" to authenticate your Store Automation workspace.
        </p>
      </div>
    );
  }

  if (!activeBusiness) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">No Business Workspace Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            You are signed in as <strong className="text-white">{currentUser.email}</strong>. Create your first real business workspace in Firestore to begin managing your store and Google profile.
          </p>
        </div>
        <div>
          <button
            onClick={onOpenCreateBusiness}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Business Workspace</span>
          </button>
        </div>
      </div>
    );
  }

  const isGbpConnected = Boolean(activeBusiness.gbpConnected && activeBusiness.gbpLocationId);

  const handleGenerateAi = async (reviewId: string) => {
    setDraftingReviewId(reviewId);
    try {
      const draft = await draftAiReply(reviewId);
      setEditingReplyText((prev) => ({ ...prev, [reviewId]: draft }));
    } catch (e) {
      console.error(e);
    } finally {
      setDraftingReviewId(null);
    }
  };

  const handleApproveAndPublish = async (reviewId: string) => {
    const text = editingReplyText[reviewId];
    if (!text?.trim()) return;
    setIsPublishingReply(reviewId);
    setReplyMessage((prev) => ({ ...prev, [reviewId]: undefined as any }));

    const res = await approveAndPublishReply(reviewId, text.trim());
    if (res.success) {
      setReplyMessage((prev) => ({
        ...prev,
        [reviewId]: { type: 'success', text: 'Reply published and recorded in Firestore activity log!' },
      }));
    } else {
      setReplyMessage((prev) => ({
        ...prev,
        [reviewId]: { type: 'error', text: res.error || 'Failed to publish reply.' },
      }));
    }
    setIsPublishingReply(null);
  };

  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);

  const populateHarmlessTestPost = () => {
    setNewPostTitle('Welcome to our Store - Fall Seasonal Update');
    setNewPostSummary('We are delighted to serve our community with updated store hours and fresh weekly selections. Thank you for your continued patronage!');
    setNewPostCta('LEARN_MORE');
    setNewPostUrl('https://storeautomation.io');
    setPostError(null);
    setPostSuccess(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostSummary.trim()) return;
    setIsPublishingPost(true);
    setPostError(null);
    setPostSuccess(null);

    const res = await publishPost({
      title: newPostTitle.trim(),
      summary: newPostSummary.trim(),
      callToAction: newPostCta,
      actionUrl: newPostUrl.trim() || 'https://storeautomation.io',
    });

    setIsPublishingPost(false);

    if (res.success) {
      setPostSuccess('Post published to Google and recorded in Firestore activity log!');
      setNewPostTitle('');
      setNewPostSummary('');
      setTimeout(() => {
        setIsCreatingPost(false);
        setPostSuccess(null);
      }, 2500);
    } else {
      setPostError(res.error || 'Failed to publish post to Google.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Workspace Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {activeBusiness.name}
              </h1>
              {isGbpConnected ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  GBP Linked
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  Google Profile Not Connected
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{activeBusiness.address}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">Category: {activeBusiness.primaryCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 font-mono text-[11px]">
                Firestore ID: {activeBusiness.id}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isGbpConnected ? (
              <button
                onClick={onOpenGbpConnect}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Connect Google Business Profile</span>
              </button>
            ) : (
              <button
                onClick={syncLiveReviewsFromGoogle}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Live Google Reviews</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-t border-slate-800 pt-3">
          <button
            onClick={() => setActiveSection('reviews')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSection === 'reviews' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Reviews</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {reviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('posts')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSection === 'posts' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Google Posts</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {posts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('activity')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSection === 'activity' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Firestore Activity Audit</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {activities.length}
            </span>
          </button>
        </div>
      </div>

      {/* Section 1: Reviews */}
      {activeSection === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Google Maps & Search Reviews</span>
              {isGbpConnected ? (
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
                  LIVE GOOGLE DATA
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  AWAITING GOOGLE BUSINESS LINK
                </span>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-2">
              <p>No customer reviews currently synced for this business in Firestore.</p>
              {!isGbpConnected && (
                <button
                  onClick={onOpenGbpConnect}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Connect Google Business Profile to Pull Real Reviews
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{rev.authorName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                            />
                          ))}
                        </div>
                        <span>·</span>
                        <span>{new Date(rev.createTime).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      rev.status === 'replied' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-amber-950/60 text-amber-400 border-amber-800'
                    }`}>
                      {rev.status === 'replied' ? 'Replied' : 'Pending Response'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    "{rev.comment}"
                  </p>

                  {/* Published response or draft editor */}
                  {rev.replyText ? (
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1 text-xs">
                      <div className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Published Response:</span>
                      </div>
                      <p className="text-slate-300 italic">"{rev.replyText}"</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Owner Approval Workflow
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGenerateAi(rev.id)}
                          disabled={draftingReviewId === rev.id}
                          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{draftingReviewId === rev.id ? 'Drafting with Gemini...' : 'Draft Response with AI'}</span>
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Draft or edit your response to this Google review..."
                        value={editingReplyText[rev.id] || ''}
                        onChange={(e) => setEditingReplyText((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />

                      {replyMessage[rev.id] && (
                        <div className={`text-[11px] p-2 rounded ${
                          replyMessage[rev.id].type === 'success' ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'
                        }`}>
                          {replyMessage[rev.id].text}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApproveAndPublish(rev.id)}
                          disabled={isPublishingReply === rev.id || !editingReplyText[rev.id]?.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isPublishingReply === rev.id ? 'Publishing to Google...' : 'Approve & Publish to Google'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Posts */}
      {activeSection === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Google Business Posts</h3>
            <button
              onClick={() => setIsCreatingPost(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </button>
          </div>

          {isCreatingPost && (
            <form onSubmit={handleCreatePost} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs text-white">Create & Preview Post</div>
                <button
                  type="button"
                  onClick={populateHarmlessTestPost}
                  className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Insert Harmless Test Post Template</span>
                </button>
              </div>

              {postError && (
                <div className="p-3 bg-red-950/60 border border-red-900 rounded-lg text-xs text-red-300 space-y-1">
                  <div className="font-semibold text-red-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Google API Response Notice</span>
                  </div>
                  <div className="font-mono text-[11px] break-words">{postError}</div>
                </div>
              )}

              {postSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{postSuccess}</span>
                </div>
              )}

              <input
                type="text"
                placeholder="Post headline"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="Summary for Google Search & Maps viewers..."
                value={newPostSummary}
                onChange={(e) => setNewPostSummary(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingPost}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isPublishingPost ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Publishing to Google...</span>
                    </>
                  ) : (
                    <span>Approve & Publish to Google</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {posts.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No promotional posts published in Firestore yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-mono">PUBLISHED</span>
                    <span>{new Date(post.createTime).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{post.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{post.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 3: Firestore Activity Audit */}
      {activeSection === 'activity' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Real activity audit trail persisted under <code className="text-indigo-400 font-mono">businesses/{activeBusiness.id}/activity</code>:
          </div>
          {activities.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No activity records found yet.
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((act) => (
                <div key={act.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{act.action}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 px-1.5 py-0.2 rounded">
                        {act.platform || 'web'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{act.details}</div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-3">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
