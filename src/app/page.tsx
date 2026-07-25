'use client';

import { createClient, Session } from '@supabase/supabase-js';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://mnwsijiqizyxzjinlhel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9UUscQvUXs7lNj5qrmr2A_pTNOrBwz';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STARTER_TEXT = `92 Og|12
56 Headband|7
Alien Rock Candy x Dosidos|3
Altar Bread|5
Animal Cookies|8
Apples and Bananas|11
Astronaut Status #24|24
Astronaut Status #24 x Phantom Bride|2
Az Apple 310|1
Bad Santa|7
Bakers Dozen|6
Banana Shack|11
Bananaconda #4|3
Bando|1
Black Cherry Soda|1
Black Velvet|5
Black Velvet x Phantom Bride|3
Blue Dream|7
Blue Nerdz|8
Blue Nerdz x Phantom Bride|8
Blue Razzicle|5
Blue Ritz 22|4
Blue Zushi|6
Blueberry Maraschino|28
BTYOG|13
Canal St. Runtz|6
Charlies Dream|4
Cheese|3
Cheetah Piss x Sour Runtz|2
Chem Wrecker|19
Chemdog D|4
Cherry Afghan|2
Cherry Gush|3
Chocolate Orange Cream|8
Cindy XX|5
Crescendo|8
Cuban Black Haze|6
Daywrecker Diesel|10
Death Coast|16
Death Star|39
Detroit Muscle|9
DJ Short Blueberry|3
DJ Short Blueberry x Phantom Bride|7
Dog Food AKA London Jealousy|4
Dolato|7
Dosidos|7
Double Rainbow|1
Dr Who|4
Dr. Doom|3
E Lambs Breath|8
Exodus Cheese|3
Fire Crotch|18
Forum GSC|12
Fritter Fuel|6
Fruity Freak|2
Fruity Pebbles OG|34
FuelZ|16
Gaby Sour D|5
Garlotti|1
Gary had a lil Lamb|11
Gary Payton|4
Geisha Breath|4
Gelonade|7
Georgia Pie|10
Glitter Bomb|5
GMO #1|53
GMO x Georgia Pie AKA Bomb Sauce|39
Grape Ape x Schrom|3
Grape Guava|6
Hardcore OG|1
Hash Burger|47
Honey Banana|24
Honey Banana x Phantom Bride|3
Illusion|2
Invisible Ink|4
Jack Herer|6
Jealousy x East Side OG|8
Jelly Drip|47
Josh D OG|4
Koffee Breath V3|1
KUSH PUP|4
LCG BX|5
LCG x RS-11|11
Legend OG|16
Lemon Cherry Gelato|1
Lemorang|5
Local Skunk|7
London Pound Cake|2
London Pound Mints|1
LSD|2
M.A.C. 1|13
Martian Candy OG|4
Masterpiece OG|9
Melon Dew|11
Meow Woof|18
Moon Bow x Phantom Bride|15
Moon Walker|2
Moonbow|47
Motor Breath #15|22
Not So Diesel|3
Obama Toyz|5
OG Kush|40
OG Kush Breath (mutant pheno)|42
Ohana OG|20
Oil Tanker|4
Original Glue AKA GG4|7
Papaya Bx|1
Papaya Power|3
Peanut Butter Breath|8
Phantom Bride|9
Pirate Kush|36
Platinum Float|14
Platinum Garlic Kush Mintz x Willson|8
Platinum Lemon|4
Poppin Bottlez|10
Purple Cheese|1
Purple Webster|4
Rose x Schrom|1
Say Less|8
SFV OG|21
Sherb Cocktail|13
Sherb Cream Pie|16
Shock Tartz|13
Skelly Hashplant aka The PUCK|8
So Cal Master Kush|5
Soap #1|3
Soda Fountain|5
Sour Diesel|7
Sour Magic 3N|1
Sour Zoda|3
Soureen #16|19
Star Killer|8
Star Tropic|4
Starburst x TMZ|5
Stunt Double|10
Sunset Sherb|9
Super Boof|9
Super Silver Haze|4
Super Silver Maple|4
Supreme Snowman|3
Swampwater Fumez|3
Tahoe OG|15
Tahoe OG x TMZ|7
Toad Banger|12
Tomahawk|10
UFOz|3
Ultra Pink 3N|2
Valley Og|11
Walker OG|17
Watermelon Zkittlez x Limepop|1
Wedding Crasher|4
West Coast Sour Diesel x Limepop|4
White Iverson|13
Ya Smell Me|3
Z Kush|2
ZK Mints|4
Zkittlez|6`;

const KNOWN: Record<string, { breeder: string; cross: string; flavors: string[] }> = {
  'Blue Zushi': { breeder: 'The Ten Co.', cross: 'Kush Mints × Zkittlez', flavors: ['Sweet candy', 'Mint', 'Gas'] },
  'Cheese': { breeder: 'UK clone-only selection', cross: 'Skunk #1 selected phenotype', flavors: ['Cheese', 'Skunk', 'Earth'] },
  'Chemdog D': { breeder: 'Chemdog line', cross: 'Chemdog family clone-only selection', flavors: ['Diesel', 'Chem', 'Earth'] },
  'Chocolate Orange Cream': { breeder: 'Exotic Genetix', cross: 'Chocolate Oranges × Cookies & Cream F2', flavors: ['Chocolate', 'Orange', 'Cream'] },
  'Daywrecker Diesel': { breeder: 'East Coast Diesel line', cross: '’91 Chemdog × Massachusetts Super Skunk × Northern Lights', flavors: ['Diesel', 'Pine', 'Citrus'] },
  'Death Star': { breeder: 'Team Death Star', cross: 'Sensi Star × Sour Diesel', flavors: ['Diesel', 'Skunk', 'Earth'] },
  'DJ Short Blueberry': { breeder: 'DJ Short', cross: 'Highland Thai × Purple Thai × Afghani-derived selections', flavors: ['Blueberry', 'Sweet fruit', 'Earth'] },
  'Dolato': { breeder: 'Archive Seed Bank', cross: 'Do-Si-Dos × Gelato #41', flavors: ['Sweet', 'Earth', 'Lavender'] },
  'Dosidos': { breeder: 'Archive Seed Bank', cross: 'OGKB × Face Off OG BX1', flavors: ['Earth', 'Lime', 'Fuel'] },
  'Exodus Cheese': { breeder: 'Exodus collective', cross: 'Skunk #1 selected phenotype', flavors: ['Cheese', 'Skunk', 'Earth'] },
  'Forum GSC': { breeder: 'Forum cut', cross: 'Girl Scout Cookies selected phenotype', flavors: ['Sweet dough', 'Mint', 'Earth'] },
  'Fruity Pebbles OG': { breeder: 'Alien Genetics', cross: 'Green Ribbon × Granddaddy Purple × Tahoe Alien', flavors: ['Tropical fruit', 'Sweet cereal', 'Berry'] },
  'Gary Payton': { breeder: 'Powerzzzup Genetics × Cookies', cross: 'The Y × Snowman', flavors: ['Gas', 'Herbal', 'Sweet'] },
  'Gelonade': { breeder: 'Connected Cannabis Co.', cross: 'Lemon Tree × Gelato #41', flavors: ['Lemon', 'Sweet candy', 'Cream'] },
  'Georgia Pie': { breeder: 'Seed Junky Genetics', cross: 'Gellati × Kush Mints #11', flavors: ['Peach', 'Sweet dough', 'Gas'] },
  'Glitter Bomb': { breeder: 'Compound Genetics', cross: 'Grape Gas #10 × OGKB Blueberry Headband', flavors: ['Grape', 'Berry', 'Gas'] },
  'GMO #1': { breeder: 'Mamiko Seeds', cross: 'Chemdog D × Forum GSC', flavors: ['Garlic', 'Onion', 'Diesel'] },
  'Hash Burger': { breeder: 'Skunk House Genetics', cross: 'Han Solo Burger × Double Burger', flavors: ['Fuel', 'Earth', 'Savory'] },
  'Honey Banana': { breeder: 'Elemental Seeds', cross: 'Honey Boo Boo × Strawberry Banana', flavors: ['Banana', 'Honey', 'Cream'] },
  'Jack Herer': { breeder: 'Sensi Seeds', cross: 'Haze × (Northern Lights #5 × Shiva Skunk)', flavors: ['Pine', 'Spice', 'Citrus'] },
  'Legend OG': { breeder: 'Southern California', cross: 'OG Kush-family clone-only selection', flavors: ['Pine', 'Fuel', 'Earth'] },
  'Lemon Cherry Gelato': { breeder: 'California clone-only lineage', cross: 'Sunset Sherbet × Girl Scout Cookies', flavors: ['Lemon', 'Cherry', 'Sweet cream'] },
  'London Pound Cake': { breeder: 'Cookies', cross: 'Sunset Sherbet × unknown indica selection', flavors: ['Berry', 'Cake', 'Citrus'] },
  'London Pound Mints': { breeder: 'Seed Junky Genetics', cross: 'London Pound Cake #75 × Kush Mints #11', flavors: ['Mint', 'Cake', 'Gas'] },
  'M.A.C. 1': { breeder: 'Capulator', cross: 'Alien Cookies F2 × Miracle 15', flavors: ['Citrus', 'Floral', 'Sweet dough'] },
  'Motor Breath #15': { breeder: 'Motorbreath line', cross: 'Chemdog × SFV OG Kush', flavors: ['Diesel', 'Fuel', 'Earth'] },
  'OG Kush': { breeder: 'Southern California', cross: 'Reported Chemdog × Lemon Thai × Hindu Kush ancestry', flavors: ['Fuel', 'Pine', 'Lemon'] },
  'Oil Tanker': { breeder: 'Surfr Seeds', cross: 'Motorbreath × Trophy Wife', flavors: ['Diesel', 'Spice', 'Earth'] },
  'Original Glue AKA GG4': { breeder: 'GG Strains', cross: 'Chem’s Sister × Sour Dubb × Chocolate Diesel', flavors: ['Diesel', 'Chocolate', 'Earth'] },
  'Papaya Power': { breeder: 'Oni Seed Co.', cross: 'Papaya × Blue Power', flavors: ['Papaya', 'Tropical fruit', 'Spice'] },
  'Peanut Butter Breath': { breeder: 'ThugPug Genetics', cross: 'Do-Si-Dos × Mendo Breath', flavors: ['Nutty', 'Earth', 'Herbal'] },
  'SFV OG': { breeder: 'San Fernando Valley clone-only', cross: 'OG Kush selected phenotype', flavors: ['Lemon', 'Pine', 'Fuel'] },
  'Soap #1': { breeder: 'Seed Junky Genetics × Cookies', cross: 'Animal Mints × Kush Mints', flavors: ['Floral', 'Mint', 'Soap'] },
  'Sour Diesel': { breeder: 'East Coast clone-only line', cross: 'Lineage disputed; commonly tied to Chemdog and Super Skunk families', flavors: ['Diesel', 'Citrus', 'Skunk'] },
  'Star Killer': { breeder: 'Rare Dankness', cross: 'Skywalker OG × Rare Dankness #2', flavors: ['Lemon', 'Pine', 'Fuel'] },
  'Sunset Sherb': { breeder: 'Sherbinskis', cross: 'Girl Scout Cookies × Pink Panties', flavors: ['Sweet berry', 'Citrus', 'Cream'] },
  'Super Boof': { breeder: 'Blockhead Buds', cross: 'Black Cherry Punch × Tropicana Cookies', flavors: ['Cherry', 'Orange', 'Tropical'] },
  'Super Silver Haze': { breeder: 'Green House Seed Co.', cross: 'Skunk #1 × Northern Lights #5 × Haze', flavors: ['Citrus', 'Spice', 'Herbal'] },
  'Swampwater Fumez': { breeder: 'Bloom Seed Co.', cross: 'OGKB 2.1 × Candy Fumez', flavors: ['Sweet gas', 'Candy', 'Earth'] },
  'Tahoe OG': { breeder: 'Lake Tahoe clone-only', cross: 'OG Kush selected phenotype', flavors: ['Lemon', 'Pine', 'Fuel'] },
  'White Iverson': { breeder: 'LIT Farms', cross: '(Blue Zushi × Lemon Cherry Gelato) × Permanent Marker', flavors: ['Citrus', 'Berry', 'Candy'] },
  'Z Kush': { breeder: 'California', cross: 'Grape Ape × Grapefruit × unknown third parent', flavors: ['Grape', 'Citrus', 'Sweet'] },
  'Zkittlez': { breeder: '3rd Gen Family / Terp Hogz', cross: 'Grape Ape × Grapefruit × undisclosed cultivar', flavors: ['Candy', 'Tropical', 'Grape'] },
};

const TAGS = ['Mother', 'Clone', 'Male', 'Keeper', 'In Flower', 'Veg', 'Archived'];

type Strain = { id: string; name: string; current_count: number; breeder: string; cross_name: string; lineage: string; flavors: string[]; tags: string[]; general_notes: string; status: string };
type Project = { id: string; name: string; female_parent: string; male_parent: string; generation: string; plant_count: number; stage: string; notes: string };
type Seed = { id: string; name: string; breeder: string; packs: number; seeds_per_pack: number; notes: string };
type Note = { id: string; note_text: string; created_at: string };
type Photo = { id: string; storage_path: string; url?: string };
type Tab = 'library' | 'breeding' | 'seeds' | 'more';

function starterRows(ownerId: string) {
  return STARTER_TEXT.split('\n').map((line) => {
    const [name, count] = line.split('|');
    const known = KNOWN[name];
    return {
      owner_id: ownerId,
      name,
      current_count: Number(count),
      category: 'Unknown',
      breeder: known?.breeder ?? 'Unknown',
      cross_name: known?.cross ?? 'Research needed',
      lineage: known?.cross ?? 'Research needed',
      flavors: known?.flavors ?? [],
      tags: [],
      general_notes: known ? 'Reported public lineage. Confirm against source material.' : '',
      status: known ? 'Public genetics — verify cut' : 'Needs research',
    };
  });
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState('Connecting…');
  const [authMessage, setAuthMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('library');
  const [strains, setStrains] = useState<Strain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('az');
  const [tagFilter, setTagFilter] = useState('');
  const [selected, setSelected] = useState<Strain | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', count: 0, breeder: '', cross: '', lineage: '', flavors: '', tags: '', notes: '' });
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', female: '', male: '', generation: '', count: 0, stage: '', notes: '' });
  const [seedOpen, setSeedOpen] = useState(false);
  const [seedForm, setSeedForm] = useState({ name: '', breeder: '', packs: 1, perPack: 0, notes: '' });

  const loadAll = useCallback(async (activeSession: Session) => {
    setSync('Syncing…');
    const [strainResult, projectResult, seedResult] = await Promise.all([
      supabase.from('strains').select('*').order('name'),
      supabase.from('breeding_projects').select('*').order('created_at', { ascending: false }),
      supabase.from('seed_inventory').select('*').order('name'),
    ]);
    const error = strainResult.error || projectResult.error || seedResult.error;
    if (error) {
      setSync('Setup required');
      setAuthMessage(`The Supabase project is connected, but the database setup is incomplete: ${error.message}`);
      return;
    }
    if ((strainResult.data?.length ?? 0) === 0) {
      const rows = starterRows(activeSession.user.id);
      for (let index = 0; index < rows.length; index += 50) {
        const insert = await supabase.from('strains').insert(rows.slice(index, index + 50));
        if (insert.error) {
          setAuthMessage(insert.error.message);
          setSync('Setup error');
          return;
        }
      }
      return loadAll(activeSession);
    }
    setStrains((strainResult.data ?? []) as Strain[]);
    setProjects((projectResult.data ?? []) as Project[]);
    setSeeds((seedResult.data ?? []) as Seed[]);
    setSync('Synced');
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadAll(data.session);
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) loadAll(nextSession);
      else {
        setStrains([]);
        setProjects([]);
        setSeeds([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadAll]);

  useEffect(() => {
    if (!session) return;
    const refresh = () => loadAll(session);
    window.addEventListener('focus', refresh);
    const channel = supabase.channel('nutt-bank-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'strains', filter: `owner_id=eq.${session.user.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'breeding_projects', filter: `owner_id=eq.${session.user.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seed_inventory', filter: `owner_id=eq.${session.user.id}` }, refresh)
      .subscribe();
    return () => {
      window.removeEventListener('focus', refresh);
      supabase.removeChannel(channel);
    };
  }, [session, loadAll]);

  const filtered = useMemo(() => {
    let output = strains.filter((strain) => {
      const text = [strain.name, strain.breeder, strain.cross_name, strain.lineage, ...(strain.flavors ?? []), ...(strain.tags ?? [])].join(' ').toLowerCase();
      return text.includes(query.toLowerCase()) && (!tagFilter || strain.tags?.includes(tagFilter));
    });
    output = [...output].sort((a, b) => sort === 'count' ? b.current_count - a.current_count || a.name.localeCompare(b.name) : sort === 'low' ? a.current_count - b.current_count || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
    return output;
  }, [strains, query, sort, tagFilter]);

  const totalPlants = strains.reduce((total, strain) => total + Number(strain.current_count || 0), 0);
  const totalPacks = seeds.reduce((total, seed) => total + Number(seed.packs || 0), 0);
  const totalSeeds = seeds.reduce((total, seed) => total + Number(seed.packs || 0) * Number(seed.seeds_per_pack || 0), 0);

  async function signIn() {
    setAuthMessage('Signing in…');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setAuthMessage(result.error?.message ?? '');
  }

  async function signUp() {
    setAuthMessage('Creating account…');
    const result = await supabase.auth.signUp({ email: email.trim(), password });
    setAuthMessage(result.error?.message ?? (result.data.session ? 'Account created.' : 'Check your email to confirm the account.'));
  }

  async function openStrain(strain: Strain) {
    setSelected(strain);
    const [noteResult, photoResult] = await Promise.all([
      supabase.from('strain_notes').select('*').eq('strain_id', strain.id).order('created_at', { ascending: false }),
      supabase.from('strain_photos').select('*').eq('strain_id', strain.id).order('created_at', { ascending: false }),
    ]);
    setNotes((noteResult.data ?? []) as Note[]);
    const signed: Photo[] = [];
    for (const photo of (photoResult.data ?? []) as Photo[]) {
      const result = await supabase.storage.from('strain-images').createSignedUrl(photo.storage_path, 3600);
      signed.push({ ...photo, url: result.data?.signedUrl });
    }
    setPhotos(signed);
  }

  async function updateCount(value: number) {
    if (!selected) return;
    const count = Math.max(0, value);
    const result = await supabase.from('strains').update({ current_count: count }).eq('id', selected.id);
    if (result.error) return alert(result.error.message);
    const updated = { ...selected, current_count: count };
    setSelected(updated);
    setStrains((items) => items.map((item) => item.id === updated.id ? updated : item));
  }

  async function toggleTag(tag: string) {
    if (!selected) return;
    const tags = [...(selected.tags ?? [])];
    const index = tags.indexOf(tag);
    if (index >= 0) tags.splice(index, 1); else tags.push(tag);
    const result = await supabase.from('strains').update({ tags }).eq('id', selected.id);
    if (result.error) return alert(result.error.message);
    const updated = { ...selected, tags };
    setSelected(updated);
    setStrains((items) => items.map((item) => item.id === updated.id ? updated : item));
  }

  async function addNote() {
    if (!selected || !session) return;
    const text = window.prompt('Quick note');
    if (!text) return;
    const result = await supabase.from('strain_notes').insert({ owner_id: session.user.id, strain_id: selected.id, note_text: text });
    if (result.error) return alert(result.error.message);
    openStrain(selected);
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected || !session) return;
    setSync('Uploading photo…');
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${session.user.id}/${selected.id}/${Date.now()}.${extension}`;
    const upload = await supabase.storage.from('strain-images').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (upload.error) return alert(upload.error.message);
    const row = await supabase.from('strain_photos').insert({ owner_id: session.user.id, strain_id: selected.id, storage_path: path });
    if (row.error) return alert(row.error.message);
    setSync('Synced');
    openStrain(selected);
  }

  function startEdit(strain?: Strain) {
    const item = strain ?? null;
    setEditForm({ id: item?.id ?? '', name: item?.name ?? '', count: item?.current_count ?? 0, breeder: item?.breeder ?? '', cross: item?.cross_name ?? '', lineage: item?.lineage ?? '', flavors: (item?.flavors ?? []).join(', '), tags: (item?.tags ?? []).join(', '), notes: item?.general_notes ?? '' });
    setEditOpen(true);
  }

  async function saveStrain() {
    if (!session || !editForm.name.trim()) return;
    const row = { owner_id: session.user.id, name: editForm.name.trim(), current_count: Number(editForm.count) || 0, category: 'Unknown', breeder: editForm.breeder.trim() || 'Unknown', cross_name: editForm.cross.trim() || 'Research needed', lineage: editForm.lineage.trim() || editForm.cross.trim() || 'Research needed', flavors: editForm.flavors.split(',').map((item) => item.trim()).filter(Boolean), tags: editForm.tags.split(',').map((item) => item.trim()).filter(Boolean), general_notes: editForm.notes.trim(), status: 'Owner updated' };
    const result = editForm.id ? await supabase.from('strains').update(row).eq('id', editForm.id) : await supabase.from('strains').insert(row);
    if (result.error) return alert(result.error.message);
    setEditOpen(false);
    setSelected(null);
    loadAll(session);
  }

  async function removeStrain() {
    if (!selected || !window.confirm(`Remove ${selected.name}?`)) return;
    const result = await supabase.from('strains').delete().eq('id', selected.id);
    if (result.error) return alert(result.error.message);
    setSelected(null);
    if (session) loadAll(session);
  }

  async function saveProject() {
    if (!session || !projectForm.name.trim()) return;
    const result = await supabase.from('breeding_projects').insert({ owner_id: session.user.id, name: projectForm.name.trim(), female_parent: projectForm.female.trim(), male_parent: projectForm.male.trim(), generation: projectForm.generation.trim(), plant_count: Number(projectForm.count) || 0, stage: projectForm.stage.trim(), notes: projectForm.notes.trim() });
    if (result.error) return alert(result.error.message);
    setProjectOpen(false);
    setProjectForm({ name: '', female: '', male: '', generation: '', count: 0, stage: '', notes: '' });
    loadAll(session);
  }

  async function removeProject(id: string) {
    if (!session || !window.confirm('Remove this breeding project?')) return;
    const result = await supabase.from('breeding_projects').delete().eq('id', id);
    if (result.error) return alert(result.error.message);
    loadAll(session);
  }

  async function saveSeed() {
    if (!session || !seedForm.name.trim()) return;
    const result = await supabase.from('seed_inventory').insert({ owner_id: session.user.id, name: seedForm.name.trim(), breeder: seedForm.breeder.trim(), packs: Number(seedForm.packs) || 0, seeds_per_pack: Number(seedForm.perPack) || 0, notes: seedForm.notes.trim() });
    if (result.error) return alert(result.error.message);
    setSeedOpen(false);
    setSeedForm({ name: '', breeder: '', packs: 1, perPack: 0, notes: '' });
    loadAll(session);
  }

  async function removeSeed(id: string) {
    if (!session || !window.confirm('Remove this seed entry?')) return;
    const result = await supabase.from('seed_inventory').delete().eq('id', id);
    if (result.error) return alert(result.error.message);
    loadAll(session);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), strains, projects, seeds }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nutt-bank-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!session) {
    return <div className="authScreen"><div className="authBox"><h1>The Nutt Bank</h1><p>Sign in once. The live strain library, counts, photos, breeding projects, and seed inventory will stay backed up and synced.</p><label>Email</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="dana@example.com"/><label style={{ display: 'block', fontWeight: 750, margin: '12px 0 6px' }}>Password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && signIn()} placeholder="Password"/><div className="authActions"><button className="btn primary" onClick={signIn}>Sign in</button><button className="btn ghost" onClick={signUp}>Create account</button></div><p className="notice">{authMessage}</p></div></div>;
  }

  return <div className="app">
    <header><div className="titleRow"><div><div className="title">The Nutt Bank</div><div className="sub">{strains.length} strains · {totalPlants.toLocaleString()} plants</div><div className="statusBar"><span className={`dot ${sync === 'Synced' ? 'online' : sync.includes('error') || sync.includes('required') ? 'error' : ''}`}></span><span>{sync}</span></div></div>{tab === 'library' && <button className="iconBtn" onClick={() => startEdit()} aria-label="Add strain">+</button>}</div>{tab === 'library' && <><div className="search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search strain, breeder or lineage…"/></div><div className="toolbar"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="az">A–Z</option><option value="count">Most plants</option><option value="low">Fewest plants</option></select><select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="">All tags</option>{TAGS.map((tag) => <option key={tag}>{tag}</option>)}</select></div></>}</header>

    {loading ? <main><div className="empty">Loading library…</div></main> : <>
      {tab === 'library' && <main><div className="summary"><div className="metric"><b>{strains.length}</b><span>live strains</span></div><div className="metric"><b>{totalPlants.toLocaleString()}</b><span>current plants</span></div></div><div className="list">{filtered.map((strain) => <div className="strain" key={strain.id} onClick={() => openStrain(strain)}><div><h3>{strain.name}</h3><div className="meta">{strain.cross_name !== 'Research needed' ? strain.cross_name : strain.breeder}</div>{strain.tags?.length > 0 && <div className="tags">{strain.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}</div><span className="count">{strain.current_count}</span></div>)}</div></main>}
      {tab === 'breeding' && <main><div className="sectionHead"><h2>Current projects</h2><button className="btn primary" onClick={() => setProjectOpen(true)}>Add</button></div>{projects.length === 0 ? <div className="empty">No current breeding projects.</div> : projects.map((project) => <div className="project" key={project.id}><h3>{project.name}</h3><div className="meta">{project.female_parent || 'Unknown female'} × {project.male_parent || 'Unknown male'}</div><div className="statRow"><span className="stat">{project.generation || 'Generation not set'}</span><span className="stat">{project.plant_count} plants</span><span className="stat">{project.stage || 'Stage not set'}</span></div>{project.notes && <p>{project.notes}</p>}<button className="btn danger" onClick={() => removeProject(project.id)}>Remove</button></div>)}</main>}
      {tab === 'seeds' && <main><div className="sectionHead"><h2>Seed inventory</h2><button className="btn primary" onClick={() => setSeedOpen(true)}>Add</button></div><div className="summary"><div className="metric"><b>{totalPacks}</b><span>packs</span></div><div className="metric"><b>{totalSeeds}</b><span>estimated seeds</span></div></div>{seeds.length === 0 ? <div className="empty">Ready for Dana’s seed inventory list.</div> : seeds.map((seed) => <div className="seed" key={seed.id}><h3>{seed.name}</h3><div className="meta">{seed.breeder || 'Unknown breeder'}</div><div className="statRow"><span className="stat">{seed.packs} packs</span><span className="stat">{seed.seeds_per_pack} per pack</span></div>{seed.notes && <p>{seed.notes}</p>}<button className="btn danger" onClick={() => removeSeed(seed.id)}>Remove</button></div>)}</main>}
      {tab === 'more' && <main><div className="sectionHead"><h2>Account and backup</h2></div>{authMessage && <div className="panel"><h3>Setup status</h3><p className="notice">{authMessage}</p></div>}<div className="panel"><h3>Cloud sync</h3><p className="notice">Signed in as {session.user.email}. Supabase stores the library, photos, notes, breeding projects, and seed inventory.</p></div><div className="panel"><h3>Inventory snapshot</h3><p><strong>{strains.length}</strong> strains · <strong>{totalPlants.toLocaleString()}</strong> plants</p></div><div className="panel"><button className="btn primary" style={{ width: '100%', marginBottom: 8 }} onClick={exportBackup}>Export backup</button><button className="btn danger" style={{ width: '100%' }} onClick={() => supabase.auth.signOut()}>Sign out</button></div></main>}
    </>}

    <nav className="bottomNav">{(['library', 'breeding', 'seeds', 'more'] as Tab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'library' ? 'Library' : item[0].toUpperCase() + item.slice(1)}</button>)}</nav>

    {selected && <div className="modal"><div className="modalHead"><button className="btn ghost" onClick={() => setSelected(null)}>Back</button><button className="btn ghost" onClick={() => startEdit(selected)}>Edit</button></div><div className="detailHero"><div className="sub" style={{ color: '#d9eadc' }}>{selected.breeder}</div><h1>{selected.name}</h1><div>{selected.current_count} current plants</div></div><div className="detailContent"><div className="panel"><h3>Current plants</h3><div className="counter"><button onClick={() => updateCount(selected.current_count - 1)}>−</button><input type="number" value={selected.current_count} onChange={(event) => updateCount(Number(event.target.value))}/><button onClick={() => updateCount(selected.current_count + 1)}>+</button></div></div><div className="panel"><h3>Tags</h3><div className="quickTags">{TAGS.map((tag) => <button key={tag} className={`quickTag ${selected.tags?.includes(tag) ? 'on' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>)}</div></div><div className="panel"><h3>Cross</h3><div>{selected.cross_name}</div></div><div className="panel"><h3>Lineage</h3><div>{selected.lineage}</div></div><div className="panel"><h3>Flavor profile</h3><div className="tags">{selected.flavors?.length ? selected.flavors.map((flavor) => <span className="tag" key={flavor}>{flavor}</span>) : <span className="notice">Not entered</span>}</div></div><div className="panel"><h3>Photos</h3><div className="photos">{photos.map((photo) => photo.url && <img key={photo.id} src={photo.url} alt={`${selected.name} upload`}/>)}</div><label className="upload">Add photo<input type="file" accept="image/*" capture="environment" hidden onChange={uploadPhoto}/></label></div><div className="panel"><h3>Notes</h3>{notes.map((note) => <div className="note" key={note.id}><time>{new Date(note.created_at).toLocaleDateString()}</time>{note.note_text}</div>)}<button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={addNote}>Add note</button></div><button className="btn danger" style={{ width: '100%' }} onClick={removeStrain}>Remove strain</button></div></div>}

    {editOpen && <div className="modal"><div className="modalHead"><button className="btn ghost" onClick={() => setEditOpen(false)}>Cancel</button><strong>{editForm.id ? 'Edit strain' : 'Add strain'}</strong><button className="btn primary" onClick={saveStrain}>Save</button></div><div className="form"><label>Strain name</label><input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}/><label>Current plants</label><input type="number" min="0" value={editForm.count} onChange={(event) => setEditForm({ ...editForm, count: Number(event.target.value) })}/><label>Breeder / origin</label><input value={editForm.breeder} onChange={(event) => setEditForm({ ...editForm, breeder: event.target.value })}/><label>Cross</label><input value={editForm.cross} onChange={(event) => setEditForm({ ...editForm, cross: event.target.value })}/><label>Extended lineage</label><textarea value={editForm.lineage} onChange={(event) => setEditForm({ ...editForm, lineage: event.target.value })}/><label>Flavor profile</label><input value={editForm.flavors} onChange={(event) => setEditForm({ ...editForm, flavors: event.target.value })} placeholder="Gas, citrus, sweet"/><label>Tags</label><input value={editForm.tags} onChange={(event) => setEditForm({ ...editForm, tags: event.target.value })} placeholder="Mother, Clone, Male"/><label>General notes</label><textarea value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })}/></div></div>}

    {projectOpen && <div className="modal"><div className="modalHead"><button className="btn ghost" onClick={() => setProjectOpen(false)}>Cancel</button><strong>Add breeding project</strong><button className="btn primary" onClick={saveProject}>Save</button></div><div className="form"><label>Project name</label><input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}/><label>Female / mother</label><input value={projectForm.female} onChange={(event) => setProjectForm({ ...projectForm, female: event.target.value })}/><label>Male / pollen donor</label><input value={projectForm.male} onChange={(event) => setProjectForm({ ...projectForm, male: event.target.value })}/><label>Generation</label><input value={projectForm.generation} onChange={(event) => setProjectForm({ ...projectForm, generation: event.target.value })} placeholder="F1, F2, BX1, S1"/><label>Plants in project</label><input type="number" min="0" value={projectForm.count} onChange={(event) => setProjectForm({ ...projectForm, count: Number(event.target.value) })}/><label>Stage</label><input value={projectForm.stage} onChange={(event) => setProjectForm({ ...projectForm, stage: event.target.value })}/><label>Notes</label><textarea value={projectForm.notes} onChange={(event) => setProjectForm({ ...projectForm, notes: event.target.value })}/></div></div>}

    {seedOpen && <div className="modal"><div className="modalHead"><button className="btn ghost" onClick={() => setSeedOpen(false)}>Cancel</button><strong>Add seed inventory</strong><button className="btn primary" onClick={saveSeed}>Save</button></div><div className="form"><label>Strain / line</label><input value={seedForm.name} onChange={(event) => setSeedForm({ ...seedForm, name: event.target.value })}/><label>Breeder</label><input value={seedForm.breeder} onChange={(event) => setSeedForm({ ...seedForm, breeder: event.target.value })}/><label>Packs</label><input type="number" min="0" value={seedForm.packs} onChange={(event) => setSeedForm({ ...seedForm, packs: Number(event.target.value) })}/><label>Seeds per pack</label><input type="number" min="0" value={seedForm.perPack} onChange={(event) => setSeedForm({ ...seedForm, perPack: Number(event.target.value) })}/><label>Notes</label><textarea value={seedForm.notes} onChange={(event) => setSeedForm({ ...seedForm, notes: event.target.value })}/></div></div>}
  </div>;
}
