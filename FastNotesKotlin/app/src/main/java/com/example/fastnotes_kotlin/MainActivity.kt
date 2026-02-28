package com.example.fastnotes_kotlin

import android.graphics.Outline
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.fastnotes_kotlin.ui.theme.FastNotesKotlinTheme
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.compose.composable
import androidx.compose.foundation.clickable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FastNotesKotlinTheme {
                FastNotesApp()
            }
        }
    }
}

@Composable
fun FastNotesApp() {
    val navController = rememberNavController()
    val vm: NotesViewModel = viewModel()

    NavHost(navController = navController, startDestination = Routes.LIST) {
        composable(Routes.LIST) {
            NotesListScreen(
                notes = vm.notes,
                onAddClick = { navController.navigate(Routes.NEW) },
                onNoteClick = { id -> navController.navigate(Routes.details(id)) }
            )
        }

        composable(Routes.NEW) {
            NewNotesScreen(
                onSave = { title, content ->
                    vm.addNote(title, content)
                    navController.popBackStack()
                },
                onCancel = { navController.popBackStack() }
            )
        }

        composable(route = Routes.DETAILS,
            arguments = listOf(navArgument("noteId") { type = NavType.LongType }))
        {
            entry ->
            val noteId = entry.arguments?.getLong("noteId") ?: -1L
            val note = vm.getNote(noteId)

            NoteDetailsScreen(note = note, onBack = { navController.popBackStack() })
        }
    }
}

@Composable
fun NotesListScreen(notes: List<Note>, onAddClick: () -> Unit, onNoteClick: (Long) -> Unit) {
    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = onAddClick,
                modifier = Modifier.offset(x = (-26).dp, y = (-16).dp)
            ){
                Text("+")
            }
        }
    ) {padding ->
        LazyColumn(modifier = Modifier.padding(padding)) {
            items(notes){ note ->
                Text(
                    text = note.title,
                    modifier = Modifier
                        .fillParentMaxWidth()
                        .clickable { onNoteClick(note.id) }
                        .padding(16.dp)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewNotesScreen(onSave: (String, String) -> Unit, onCancel: () -> Unit) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }

    Scaffold(
        topBar = { TopAppBar(title = { Text("New note") }) }
    ) { padding ->
        Column(modifier = Modifier
            .padding(padding)
            .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp))
        {
            OutlinedTextField(value = title, onValueChange = { title = it },
                label = { Text("Title")}, modifier = Modifier.fillMaxWidth())

            OutlinedTextField(value = content, onValueChange = { content = it},
                label = { Text("Content")}, modifier = Modifier.fillMaxWidth(),
                minLines = 5)

            Button(onClick = { onSave(title, content) }) { Text("Save") }
            OutlinedButton(onCancel) { Text("Cancel") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteDetailsScreen(note: Note?, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Details") },
                navigationIcon = {
                    TextButton(onBack) { Text("Back") }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier
            .padding(padding)
            .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (note == null){
                Text("Note not found")
            }
            else{
                Text(note.title, style = MaterialTheme.typography.titleLarge)
                Text(note.content)
            }
        }
    }
}