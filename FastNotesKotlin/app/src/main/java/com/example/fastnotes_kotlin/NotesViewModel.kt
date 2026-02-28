package com.example.fastnotes_kotlin

import androidx.compose.runtime.mutableStateListOf
import androidx.lifecycle.ViewModel


class NotesViewModel : ViewModel() {
    val notes = mutableStateListOf(
        Note(1, "First note", "This is my first note"),
        Note(2, "Second note", "This is my second note")
    )

    fun addNote(title: String, content: String) {
        val nextId = (notes.maxOfOrNull { it.id } ?: 0L) + 1L
        notes.add(Note(nextId, title, content))
    }

    fun getNote(id: Long): Note? = notes.find { it.id == id }
}