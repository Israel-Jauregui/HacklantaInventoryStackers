import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { AdminPortalShell } from '@/components/admin/AdminPortalShell';
import { useAdminPortal } from '@/context/AdminPortalContext';
import {
  formatTimestamp,
  getPriorityColor,
  getStatusColor,
  getStatusLabel,
} from '@/utils/adminPortal';
import type { AdminPriority, AdminWorkflowStatus } from '@/data/adminPortalMock';

const STATUS_OPTIONS: AdminWorkflowStatus[] = [
  'new',
  'triaged',
  'assigned',
  'in_progress',
  'resolved',
];

const PRIORITY_OPTIONS: AdminPriority[] = ['P1', 'P2', 'P3'];

export default function AdminReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { reports, updateStatus, assignPriority, addInternalNote } = useAdminPortal();
  const [noteDraft, setNoteDraft] = useState('');

  const report = id ? reports.find((item) => item.id === id) : null;

  if (!report) {
    return (
      <AdminPortalShell
        title="Report Details"
        subtitle="Open a valid admin report to manage status, priority, and internal notes."
        activeSection="reports"
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Report not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.84}
            onPress={() => router.replace('/admin/reports')}
          >
            <Text style={styles.backButtonText}>Back to reports</Text>
          </TouchableOpacity>
        </View>
      </AdminPortalShell>
    );
  }

  return (
    <AdminPortalShell
      title={report.title}
      subtitle={`${report.id} · ${report.location.address}`}
      activeSection="reports"
    >
      <TouchableOpacity
        style={styles.inlineBack}
        activeOpacity={0.8}
        onPress={() => router.push('/admin/reports')}
      >
        <Ionicons name="chevron-back" size={16} color={Colors.yellow} />
        <Text style={styles.inlineBackText}>Back to queue</Text>
      </TouchableOpacity>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{report.location.address}</Text>
          <View style={[styles.pill, { backgroundColor: `${getPriorityColor(report.priority)}16` }]}>
            <Text style={[styles.pillText, { color: getPriorityColor(report.priority) }]}>
              {report.priority}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryBody}>{report.description}</Text>
        <Text style={styles.summaryMeta}>
          {report.district} · {report.assignedTeam} · Updated {formatTimestamp(report.updatedAt)}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Status Update</Text>
        <View style={styles.optionRow}>
          {STATUS_OPTIONS.map((status) => {
            const isActive = report.status === status;
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.optionChip,
                  {
                    borderColor: isActive ? getStatusColor(status) : 'rgba(255,255,255,0.08)',
                    backgroundColor: isActive ? `${getStatusColor(status)}18` : Colors.dark3,
                  },
                ]}
                activeOpacity={0.84}
                onPress={() => updateStatus(report.id, status)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    { color: isActive ? getStatusColor(status) : Colors.muted },
                  ]}
                >
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Priority Assignment</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((priority) => {
            const isActive = report.priority === priority;
            return (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityChip,
                  {
                    borderColor: isActive ? getPriorityColor(priority) : 'rgba(255,255,255,0.08)',
                    backgroundColor: isActive ? `${getPriorityColor(priority)}18` : Colors.dark3,
                  },
                ]}
                activeOpacity={0.84}
                onPress={() => assignPriority(report.id, priority)}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    { color: isActive ? getPriorityColor(priority) : Colors.muted },
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Case Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={[styles.detailValue, { color: getStatusColor(report.status) }]}>
            {getStatusLabel(report.status)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{report.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Source</Text>
          <Text style={styles.detailValue}>{report.source}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reported By</Text>
          <Text style={styles.detailValue}>{report.reportedBy}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{formatTimestamp(report.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Internal Notes</Text>
        <View style={styles.noteComposer}>
          <TextInput
            value={noteDraft}
            onChangeText={setNoteDraft}
            multiline
            placeholder="Add an internal handoff or field note"
            placeholderTextColor={Colors.muted}
            style={styles.noteInput}
          />
          <TouchableOpacity
            style={styles.noteButton}
            activeOpacity={0.84}
            onPress={() => {
              addInternalNote(report.id, noteDraft);
              setNoteDraft('');
            }}
          >
            <Text style={styles.noteButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notesList}>
          {report.notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteAuthor}>{note.author}</Text>
                <Text style={styles.noteTimestamp}>{formatTimestamp(note.createdAt)}</Text>
              </View>
              <Text style={styles.noteMessage}>{note.message}</Text>
            </View>
          ))}
        </View>
      </View>
    </AdminPortalShell>
  );
}

const styles = StyleSheet.create({
  inlineBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  inlineBackText: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  summaryBody: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  summaryMeta: {
    color: Colors.muted,
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  detailLabel: {
    color: Colors.muted,
    fontSize: 12,
  },
  detailValue: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  noteComposer: {
    gap: 10,
  },
  noteInput: {
    minHeight: 92,
    backgroundColor: Colors.dark3,
    borderRadius: 16,
    padding: 14,
    color: Colors.white,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  noteButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  noteButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '800',
  },
  notesList: {
    gap: 10,
  },
  noteCard: {
    backgroundColor: Colors.dark3,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  noteAuthor: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  noteTimestamp: {
    color: Colors.muted,
    fontSize: 11,
  },
  noteMessage: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: Colors.black,
    fontWeight: '800',
  },
});
