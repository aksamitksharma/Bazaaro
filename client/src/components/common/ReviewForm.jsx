import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SendIcon from '@mui/icons-material/Send';
import toast from 'react-hot-toast';
import { reviewAPI } from '../../services/api';

const s = {
  container: {
    background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
  },
  header: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', fontFamily: 'Poppins' },
  starsWrapper: { display: 'flex', gap: '0.25rem', marginBottom: '1rem' },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', padding: 0 },
  textarea: {
    width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '0.75rem', fontSize: '0.9rem', fontFamily: 'Inter',
    background: 'var(--surface)', outline: 'none', minHeight: 80, resize: 'vertical',
    marginBottom: '1rem'
  },
  submitBtn: {
    padding: '0.65rem 1.25rem', border: 'none', borderRadius: 'var(--radius)',
    background: 'var(--gradient-2)', color: '#fff', fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem'
  }
};

export default function ReviewForm({ vendorId, orderId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating');
    setSubmitting(true);
    try {
      const { data } = await reviewAPI.create({ vendorId, orderId, rating, comment });
      toast.success('Review submitted successfully! 🌟');
      setRating(0);
      setComment('');
      if (onReviewSubmitted) onReviewSubmitted(data.review);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <div style={s.container}>
      <h3 style={s.header}>Write a Review</h3>
      <form onSubmit={handleSubmit}>
        <div style={s.starsWrapper}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              type="button"
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={s.starBtn}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              {star <= (hoverRating || rating) ? (
                <StarIcon style={{ fontSize: '1.8rem' }} />
              ) : (
                <StarBorderIcon style={{ fontSize: '1.8rem', opacity: 0.5 }} />
              )}
            </motion.button>
          ))}
        </div>
        <textarea
          style={s.textarea}
          placeholder="Share your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.95 }}
          type="submit" 
          disabled={submitting} 
          style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}
        >
          <SendIcon style={{ fontSize: '1rem' }} />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </motion.button>
      </form>
    </div>
  );
}
