'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Clock, Database, AlertCircle, CheckCircle2, FileSpreadsheet, Copy, Check, Search, History, RefreshCw } from 'lucide-react';

interface MinerData {
  [key: string]: string;
}

interface RedTeamData {
  success: boolean;
  timestamp?: string;
  rowCount?: number;
  headers?: string[];
  miners?: MinerData[];
  error?: string;
}

const YOUR_UID = '182';

export function RedTeamDashboard() {
  const [data, setData] = useState<RedTeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/redteam-data', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setUploadSuccess(json.message || `Merged ${json.totalMiners} miners (${json.newEntries} new)`);
        await fetchData();
      } else {
        setError(json.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        handleUpload(file);
      } else {
        setError('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getUidFromRow = (row: MinerData): string => {
    return row['Miner UID'] || row['UID'] || row['uid'] || row['miner_uid'] || '';
  };

  const isYourMiner = (row: MinerData): boolean => {
    const uid = getUidFromRow(row);
    return uid === YOUR_UID;
  };

  const filteredMiners = data?.miners?.filter(miner => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(miner).some(val => 
      val?.toString().toLowerCase().includes(searchLower)
    );
  }) || [];

  // Sort to put your miner at top
  const sortedMiners = [...filteredMiners].sort((a, b) => {
    const aIsYours = isYourMiner(a);
    const bIsYours = isYourMiner(b);
    if (aIsYours && !bIsYours) return -1;
    if (!aIsYours && bIsYours) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header + Big Refresh Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <header className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              RedTeam Intel Hub
            </h1>
            <p className="text-muted-foreground">
              Miner data from dashboard.theredteam.io
            </p>
          </header>
          
          <Button 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            size="lg"
            className="min-h-[56px] px-8 text-lg font-semibold bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            <RefreshCw className={`w-6 h-6 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Status Banner */}
        {data?.success ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-primary">{data.rowCount} miners stored</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {data.timestamp ? formatDate(data.timestamp) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-500 font-medium">No data yet - upload a CSV below</p>
          </div>
        )}

        {/* Upload Zone */}
        <Card 
          className={`border-2 border-dashed transition-all ${
            dragActive 
              ? 'border-primary bg-primary/5 scale-[1.01]' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <div className={`p-4 rounded-full transition-colors ${dragActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                {uploading ? (
                  <Upload className="w-8 h-8 text-primary animate-pulse" />
                ) : (
                  <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <p className="text-foreground font-semibold text-lg">
                  {uploading ? 'Uploading...' : dragActive ? 'Drop it here!' : 'Drop your CSV here'}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  or click Browse Files
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/csv"
                onChange={handleFileInput}
                className="sr-only"
                disabled={uploading}
              />
              <Button 
                type="button"
                variant="default" 
                size="lg" 
                className="min-h-[48px] px-8"
                disabled={uploading}
                onClick={handleBrowseClick}
              >
                <Upload className="w-5 h-5 mr-2" />
                Browse Files
              </Button>

              {uploadSuccess && (
                <div className="flex items-center gap-2 text-primary font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              API Endpoints for Your Agent
            </CardTitle>
            <CardDescription>
              Claw Bot and Grok can call these anytime to get data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Latest data:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-secondary rounded-md font-mono text-sm text-foreground overflow-x-auto">
                  GET {baseUrl}/api/redteam-data
                </code>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="min-w-[48px] min-h-[48px] flex-shrink-0"
                  onClick={() => copyToClipboard(`${baseUrl}/api/redteam-data`, 'data')}
                >
                  {copied === 'data' ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Historical data:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-secondary rounded-md font-mono text-sm text-foreground overflow-x-auto">
                  GET {baseUrl}/api/redteam-history
                </code>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="min-w-[48px] min-h-[48px] flex-shrink-0"
                  onClick={() => copyToClipboard(`${baseUrl}/api/redteam-history`, 'history')}
                >
                  {copied === 'history' ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {data?.success && data.miners && data.miners.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Miner Commit History
                  </CardTitle>
                  <CardDescription>
                    {sortedMiners.length} of {data.rowCount} miners {searchTerm && '(filtered)'}
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search miners..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 min-h-[44px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr className="border-b border-border">
                      {data.headers?.map((header, i) => (
                        <th key={i} className="text-left p-3 text-muted-foreground font-semibold whitespace-nowrap text-xs uppercase tracking-wide">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMiners.map((miner, rowIndex) => {
                      const isHighlighted = isYourMiner(miner);
                      return (
                        <tr 
                          key={rowIndex} 
                          className={`border-b border-border/50 transition-colors ${
                            isHighlighted 
                              ? 'bg-primary/15 hover:bg-primary/20' 
                              : 'hover:bg-secondary/30'
                          }`}
                        >
                          {data.headers?.map((header, cellIndex) => {
                            const value = miner[header] || '-';
                            const isStatus = header.toLowerCase().includes('status');
                            const isScore = header.toLowerCase().includes('score');
                            const isUid = header.toLowerCase().includes('uid');
                            
                            return (
                              <td 
                                key={cellIndex} 
                                className={`p-3 font-mono text-xs whitespace-nowrap ${
                                  isHighlighted ? 'text-primary font-medium' : 'text-foreground'
                                } ${isUid && isHighlighted ? 'font-bold' : ''}`}
                              >
                                {isStatus ? (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    value.toLowerCase().includes('accept') ? 'bg-green-500/20 text-green-400' :
                                    value.toLowerCase().includes('reject') ? 'bg-red-500/20 text-red-400' :
                                    value.toLowerCase().includes('received') ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-secondary text-muted-foreground'
                                  }`}>
                                    {value}
                                  </span>
                                ) : isScore ? (
                                  <span className="tabular-nums">{value}</span>
                                ) : (
                                  <span title={value.length > 30 ? value : undefined}>
                                    {value.length > 30 ? `${value.substring(0, 30)}...` : value}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading data...</div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
          <p>Your UID ({YOUR_UID}) is highlighted in the table above</p>
        </footer>
      </div>
    </div>
  );
}
