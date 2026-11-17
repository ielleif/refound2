import { useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { compress } from './ImageUploader';
import { Avatar, CameraIcon } from './Common';

// Uploads one photo and returns its URL. Profile pictures are cropped square.
export async function uploadPhoto(file, kind) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image (JPG, PNG, WEBP or GIF).');
  const data = await compress(file, kind === 'avatar' ? { max: 600, square: true } : { max: 1800 });
  const { urls } = await api.post('/auth/uploads', { images: [data] });
  return urls[0];
}

// Facebook-style header: cover photo with a profile picture overlapping it.
// onSave(field, url|null) persists the change (field is 'avatar' or 'cover').
export default function ProfilePhotos({ name, subtitle, avatar, cover, color, square = false, onSave, children }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState('');
  const coverInput = useRef();
  const avatarInput = useRef();

  const pick = async (kind, file) => {
    if (!file) return;
    setBusy(kind);
    try {
      const url = await uploadPhoto(file, kind);
      await onSave(kind, url);
      toast(kind === 'avatar' ? (square ? 'Shop logo updated' : 'Profile picture updated') : 'Cover photo updated');
    } catch (e) { toast(e.message, 'err'); }
    setBusy('');
  };
  const remove = async kind => {
    setBusy(kind);
    try { await onSave(kind, null); toast(kind === 'avatar' ? 'Photo removed' : 'Cover removed'); }
    catch (e) { toast(e.message, 'err'); }
    setBusy('');
  };

  return (
    <div className="profile-head">
      <div className={`profile-cover ${cover ? 'has-img' : ''}`} style={{ '--c': color || 'var(--red)', backgroundImage: cover ? `url("${cover}")` : undefined }}>
        <div className="profile-cover-actions">
          <button type="button" className="btn btn-sm btn-cream" disabled={!!busy} onClick={() => coverInput.current.click()}>
            {busy === 'cover' ? 'Uploading…' : <><CameraIcon size={16} /> {cover ? 'Change cover' : 'Add cover photo'}</>}
          </button>
          {cover && <button type="button" className="btn btn-sm btn-cream" disabled={!!busy} onClick={() => remove('cover')}>Remove</button>}
        </div>
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={e => { pick('cover', e.target.files[0]); e.target.value = ''; }} />
      </div>
      <div className="profile-row">
        <div className="profile-avatar-wrap">
          <Avatar src={avatar} name={name} color={color} square={square} className="profile-avatar" />
          <button type="button" className="profile-avatar-btn" disabled={!!busy} onClick={() => avatarInput.current.click()}
            aria-label={square ? 'Change shop logo' : 'Change profile picture'} title={square ? 'Change shop logo' : 'Change profile picture'}>
            {busy === 'avatar' ? <span className="spinner spinner-xs" /> : <CameraIcon size={20} />}
          </button>
          <input ref={avatarInput} type="file" accept="image/*" hidden onChange={e => { pick('avatar', e.target.files[0]); e.target.value = ''; }} />
        </div>
        <div className="profile-info">
          <h2>{name}</h2>
          {subtitle && <p>{subtitle}</p>}
          {avatar && <button type="button" className="link-btn" disabled={!!busy} onClick={() => remove('avatar')}>{square ? 'Remove logo' : 'Remove profile picture'}</button>}
        </div>
        {children && <div className="profile-extra">{children}</div>}
      </div>
    </div>
  );
}
