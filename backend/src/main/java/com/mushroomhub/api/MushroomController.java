package com.mushroomhub.api;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class MushroomController {
    private final List<Map<String, Object>> mushrooms = List.of(
        Map.of("id", "oyster", "name", "Blue Oyster Mushrooms", "type", "Oyster", "farm", "Himalayan Forest Spores Farm", "place", "Dehradun, Uttarakhand", "price", 350, "unit", "kg"),
        Map.of("id", "shiitake", "name", "Forest Shiitake", "type", "Shiitake", "farm", "Nilgiri Mycelium Growers", "place", "Ooty, Tamil Nadu", "price", 550, "unit", "kg"),
        Map.of("id", "lion-mane", "name", "Lion’s Mane", "type", "Specialty", "farm", "Himalayan Forest Spores Farm", "place", "Dehradun, Uttarakhand", "price", 650, "unit", "kg"),
        Map.of("id", "cremini", "name", "Cremini & Button", "type", "Cremini", "farm", "Valley Cap Farm", "place", "Pune, Maharashtra", "price", 240, "unit", "kg")
    );
    @GetMapping("/health")
    public Map<String, String> health() { return Map.of("status", "ok", "service", "MushroomHub API"); }
    @GetMapping("/mushrooms")
    public List<Map<String, Object>> getMushrooms() { return mushrooms; }
}
